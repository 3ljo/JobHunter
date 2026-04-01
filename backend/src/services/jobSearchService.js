// Job search service
// Fetches real job listings from JSearch API via RapidAPI

const searchJobs = async (query, location, page = 1) => {
  try {
    const params = new URLSearchParams({
      query: `${query} in ${location}`,
      page: String(page),
      num_pages: '1',
      date_posted: 'all',
    });

    const response = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      },
    });

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      return [];
    }

    // Map API response to a clean job format
    return result.data.map((job) => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: [job.job_city, job.job_country].filter(Boolean).join(', '),
      employment_type: job.job_employment_type,
      description: job.job_description ? job.job_description.substring(0, 300) : '',
      url: job.job_apply_link,
      posted_at: job.job_posted_at_datetime_utc,
      logo: job.employer_logo,
    }));
  } catch (err) {
    console.error('Job search error:', err.message);
    return [];
  }
};

module.exports = { searchJobs };
