// Job search controller
// Handles AI-powered job search and site suggestions using Claude + JSearch

const anthropic = require('../services/anthropicClient');
const { searchJobs } = require('../services/jobSearchService');

// System prompt for the career assistant
const SEARCH_SYSTEM_PROMPT = `You are a career assistant inside JobHunter app. Your job is to help users find relevant jobs.

When a user tells you what kind of job they are looking for:
1. Extract the job title/role and preferred location (if mentioned, otherwise use "remote")
2. Give a friendly short response acknowledging their interest
3. Tell them you are searching for jobs now
4. At the end of your response always output a JSON block in this exact format so the backend can parse it:

SEARCH_PARAMS:{"query":"extracted job title here","location":"extracted location or remote"}

If the user is asking a general career question (not searching for jobs), just answer helpfully without the SEARCH_PARAMS block.
Keep responses concise and friendly.`;

// AI-powered job search — parses Claude's response for search params and fetches real jobs
const searchJobsWithAI = async (req, res) => {
  const { message, conversation_history = [] } = req.body;

  try {
    // Build messages array from conversation history + new message
    const messages = [
      ...conversation_history,
      { role: 'user', content: message },
    ];

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SEARCH_SYSTEM_PROMPT,
      messages,
    });

    const aiText = response.content[0].text;

    // Check if Claude included search parameters
    const searchMatch = aiText.match(/SEARCH_PARAMS:(\{.*\})/);

    if (searchMatch) {
      // Extract and parse search params
      const searchParams = JSON.parse(searchMatch[1]);
      const { query, location } = searchParams;

      // Remove the SEARCH_PARAMS block from the display message
      const cleanMessage = aiText.replace(/SEARCH_PARAMS:\{.*\}/, '').trim();

      // Fetch real jobs from JSearch API
      const jobs = await searchJobs(query, location);

      return res.status(200).json({
        ai_message: cleanMessage,
        jobs,
        search_performed: true,
        search_query: { query, location },
      });
    }

    // No search — just return the AI response
    return res.status(200).json({
      ai_message: aiText,
      jobs: [],
      search_performed: false,
    });
  } catch (err) {
    console.error('AI search error:', err.message);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

// Get personalized job site suggestions based on user profile
const getSuggestedJobSites = async (req, res) => {
  const { job_title, career_level, preferred_locations } = req.body;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Based on this person's profile:
Job title: ${job_title}
Career level: ${career_level}
Preferred locations: ${Array.isArray(preferred_locations) ? preferred_locations.join(', ') : preferred_locations}

Suggest the 6 best job sites they should use. For each site return:
- name
- url
- why it's good for their specific profile
- whether it's free or paid

Respond ONLY in this JSON format, no extra text:
[{"name":"","url":"","reason":"","is_free":true}]`,
        },
      ],
    });

    const aiText = response.content[0].text;

    // Parse JSON from Claude's response
    const suggested_sites = JSON.parse(aiText);

    return res.status(200).json({ suggested_sites });
  } catch (err) {
    console.error('Suggested sites error:', err.message);
    return res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

module.exports = { searchJobsWithAI, getSuggestedJobSites };
