// Job Hunter Controller
// Endpoints that drive the /job-hunter dashboard tab. Takes a manual
// keyword + optional country from the user, fans out to free job APIs
// (see jobHunterService), dedupes + ranks, and persists the result so
// revisits load instantly.

const supabase = require('../services/supabaseClient');
const { findJobs: runJobSearch } = require('../services/jobHunterService');

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
// Body: { query: string, country?: string|null, location?: string|null }
//   - query: keyword/role to search for (required, e.g. "Front End")
//   - country: ISO-2 code (e.g. "de"); omit for a global search
//   - location: optional freeform city/region passed to providers that
//     accept it
// Fans out to all configured job APIs in parallel, dedupes + ranks, and
// replaces the user's previously cached match-set.
const findJobs = async (req, res) => {
  try {
    const title = String(req.body?.query || '').trim();
    if (!title) {
      return res.status(400).json({
        error: 'Please enter a job title or keyword to search for.',
        code: 'missing_query',
      });
    }

    const country = req.body?.country
      ? String(req.body.country).toLowerCase().trim() || null
      : null;
    const location = req.body?.location
      ? String(req.body.location).trim() || null
      : null;

    // Load the user's most recent CV so the scorer can rank by semantic
    // similarity (embeddings) instead of pure title-token overlap. If the
    // user hasn't run the analyzer yet, finalCv stays null and scoring
    // degrades to keyword matching — still works, just less accurate.
    let finalCv = null;
    try {
      const { data: cv } = await supabase
        .from('cvs')
        .select('ats_feedback')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      finalCv = cv?.ats_feedback?.final?.final_cv || null;
    } catch (cvErr) {
      // Non-fatal — search still works without the CV
      console.warn('jobHunter: could not load CV for scoring:', cvErr.message);
    }

    const { query, results, sourceCounts } = await runJobSearch({
      title,
      country,
      location,
      finalCv,
    });

    // No results across every source — return an empty match-set rather
    // than an error so the UI can show a graceful "no matches" state.
    // Don't persist; the user will likely retry with a different query.
    if (!results.length) {
      return res.json({
        match: {
          query,
          results: [],
          source_counts: sourceCounts,
          created_at: new Date().toISOString(),
        },
        warning: 'No jobs matched across any source. Try a broader keyword or a different country.',
      });
    }

    // Replace any older cached match-set for this user. Keeping a single
    // row per user means the table stays small and "latest" lookups are
    // trivial.
    await supabase.from('job_matches').delete().eq('user_id', req.user.id);

    const { data: saved, error: saveError } = await supabase
      .from('job_matches')
      .insert({
        user_id: req.user.id,
        cv_id: null,
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
