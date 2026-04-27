// Job Hunter Controller
// Endpoints that drive the /job-hunter dashboard tab. Pulls the user's
// latest analyzed CV, fans out to free job APIs (see jobHunterService),
// dedupes + ranks, and persists the result so revisits load instantly.

const supabase = require('../services/supabaseClient');
const { findJobsForCV } = require('../services/jobHunterService');

// GET /api/job-hunter/latest
// Returns the most recent cached match-set for this user (or null if
// they've never run a search). Used to hydrate the page on mount so the
// list shows up without a fresh API fan-out.
const getLatestMatches = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_matches')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('getLatestMatches error:', error.message);
      return res.status(500).json({ error: 'Could not load job matches' });
    }
    return res.json({ match: data || null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/job-hunter/find
// Body: { cv_id?: string }
// Resolves the CV (specific id, or the user's latest), extracts search
// terms, fans out to all configured job APIs in parallel, dedupes +
// ranks, replaces any older cached row, and returns the new match-set.
const findJobs = async (req, res) => {
  try {
    let cvId = req.body?.cv_id;
    let cv;

    if (cvId) {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('id', cvId)
        .eq('user_id', req.user.id)
        .single();
      if (error || !data) {
        return res.status(404).json({ error: 'CV not found' });
      }
      cv = data;
    } else {
      // Default to the user's most recent CV — most users will land on
      // the tab without picking a specific CV first.
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('findJobs CV lookup failed:', error.message);
        return res.status(500).json({ error: 'Could not load your CV' });
      }
      if (!data) {
        return res.status(400).json({
          error: 'No CV found. Please analyze or create a CV first.',
          code: 'no_cv',
        });
      }
      cv = data;
      cvId = data.id;
    }

    // The matcher reads from final.final_cv (the polished, structured CV)
    // because that's where skills/experience/location land in canonical
    // form. Raw uploads without an analysis run won't have this.
    const finalCv = cv.ats_feedback?.final?.final_cv;
    if (!finalCv) {
      return res.status(400).json({
        error: 'This CV has not been analyzed yet. Please run the CV Analyzer first.',
        code: 'cv_not_analyzed',
      });
    }

    const { query, results, sourceCounts } = await findJobsForCV(finalCv);

    // No results across every source — return an empty match-set rather
    // than an error so the UI can show a graceful "no matches" state.
    // Don't persist; the user will likely retry with a different CV.
    if (!results.length) {
      return res.json({
        match: {
          query,
          results: [],
          source_counts: sourceCounts,
          created_at: new Date().toISOString(),
        },
        warning: 'No jobs matched across any source. Try analyzing a CV with a clearer job title or more skills.',
      });
    }

    // Replace any older cached match-set for this user. Keeping a single
    // row per user means the table stays small and "latest" lookups are
    // trivial — if the user wants history, it lives in the CV history
    // table (each match-set is tied to a specific cv_id).
    await supabase.from('job_matches').delete().eq('user_id', req.user.id);

    const { data: saved, error: saveError } = await supabase
      .from('job_matches')
      .insert({
        user_id: req.user.id,
        cv_id: cvId,
        query,
        results,
        source_counts: sourceCounts,
      })
      .select()
      .single();

    if (saveError) {
      // Persistence is non-critical — return the live results either way
      // so the user isn't blocked by a transient DB error.
      console.error('job_matches save error:', saveError.message);
      return res.json({
        match: {
          query,
          results,
          source_counts: sourceCounts,
          created_at: new Date().toISOString(),
        },
      });
    }

    return res.json({ match: saved });
  } catch (err) {
    console.error('findJobs error:', err);
    return res.status(500).json({ error: err.message || 'Failed to find jobs' });
  }
};

// DELETE /api/job-hunter/clear
// Drops the user's cached match-set so the tab shows the empty state
// again. Mainly used by the UI's "clear results" action.
const clearMatches = async (req, res) => {
  try {
    const { error } = await supabase
      .from('job_matches')
      .delete()
      .eq('user_id', req.user.id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ message: 'Cleared' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getLatestMatches, findJobs, clearMatches };
