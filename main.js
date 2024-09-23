const fs = require("fs");
const { program } = require("commander");
require("dotenv").config();

// Fetch function for Node.js < 18, comment out if using Node.js >= 18
// const fetch = require('node-fetch');

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HUMAANS_API_URL = "https://app.humaans.io/api";
const HUMAANS_API_KEY = process.env.HUMAANS_API_KEY;

if (!GITHUB_TOKEN && !HUMAANS_API_KEY) {
  console.error(
    "GitHub or Humaans API token is missing. Set them in the .env file.",
  );
  process.exit(1);
}

function findObjectByProperty(array, propertyName, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][propertyName] === value) {
      return true;
    }
  }
  return false;
}

// Helper function to call the GitHub API
async function githubApiRequest(endpoint, params = {}) {
  const url = new URL(`${GITHUB_API_URL}${endpoint}`);
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key]),
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.statusText}`);
  }

  return response.json();
}

// Helper function to call the Humaans API
async function humaansPeopleApiRequest(queryParam) {
  const response = await fetch(`${HUMAANS_API_URL}/people?${queryParam}`, {
    headers: {
      Authorization: `Bearer ${HUMAANS_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Humaans API request failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (queryParam != null && data && data.data[0]) {
    if (data.data[0].github) return data.data[0].github;
  } else {
    if (data) return data.data;
    return data;
  }

  return false;
}

// Get all repositories in an organization and filter out empty ones
async function getOrgRepos(org) {
  let repos = [];
  let page = 1;
  const perPage = 100; // Max number of repos per page

  try {
    while (true) {
      const response = await githubApiRequest(`/orgs/${org}/repos`, {
        per_page: perPage,
        page: page,
      });
      if (response.length === 0) break; // Stop if no more repositories are returned

      repos = repos.concat(response);
      page++;
    }

    // Filter out repositories that have size 0 (indicating they are empty)
    return repos.filter((repo) => repo.size > 0);
  } catch (error) {
    console.error(
      `Error fetching repositories for organization ${org}:`,
      error.message,
    );
    return [];
  }
}

// Check user contributions in a repository
async function checkUserContributionsInRepo(repo, username) {
  try {
    const commits = await githubApiRequest(`/repos/${repo.full_name}/commits`, {
      author: username,
    });
    return commits.length > 0;
  } catch (error) {
    console.error(
      `Error fetching commits for user ${username} in repo ${repo.full_name}:`,
      error.message,
    );
    return false;
  }
}

// Check user contributions across all repositories and log the repositories at the start
async function checkUserContributions(org, searchValues) {
  const repos = await getOrgRepos(org);

  // Log the repositories at the start of the search
  console.log(`\nRepositories found in the organization "${org}":`);
  repos.forEach((repo) => {
    console.log(`  - ${repo.full_name}`);
  });
  console.log(
    `\nProceeding to check contributions for the provided users...\n`,
  );

  const employees = await humaansPeopleApiRequest();

  // Iterate through search values and check contributions
  for (const value of searchValues) {
    console.log(`\nChecking contributions for ${value}:  `);
    let userHasContributed = false;

    const isEmployee = findObjectByProperty(employees, "github", value);
    if (isEmployee) {
      console.log(">> This GitHub username is related to an employee <<\n");
    }

    for (const repo of repos) {
      const hasContributed = await checkUserContributionsInRepo(repo, value);
      if (hasContributed) {
        userHasContributed = true;
        console.log(`  - Contributed to: ${repo.full_name}`);
      }
    }

    if (!userHasContributed) {
      console.log(`  No contributions found for ${value}.`);
    }
  }
}

// Setup CLI arguments using commander
program
  .version("1.0.0")
  .description(
    "CLI tool to check GitHub contributions in an organization by searching using GitHub usernames or emails (via Humaans)",
  )
  .requiredOption(
    "-o, --org <organization>",
    "GitHub organization name to search within (required only for GitHub username search)",
  )
  .option(
    "-f, --file <file>",
    "File containing the list of search values (GitHub usernames or emails)",
    "search_values.txt",
  )
  .option(
    "-u, --humaans",
    "Indicate that search values are emails to look up via Humaans API and then check GitHub contributions",
  )
  .option(
    "-g, --github",
    "Indicate that search values are GitHub usernames and you want to check contributions",
  )
  .on("--help", () => {
    console.log("");
    console.log("Examples:");
    console.log("  Search by GitHub usernames in an organization:");
    console.log(
      "    $ node index.js --org my-org --file usernames.txt --github",
    );
    console.log("");
    console.log("  Search by emails (via Humaans API):");
    console.log("    $ node index.js --org my-org --file emails.txt --humaans");
    console.log("");
    console.log("Note: --org is *always* required.");
  })
  .parse(process.argv);

const options = program.opts();

// Validate that either --email or --github is specified
if (!options.humaans && !options.github) {
  console.error(
    "You must specify either --humaans or --github to indicate the type of search values.",
  );
  process.exit(1);
}

// Read the list of search values from the specified file
const searchValues = fs
  .readFileSync(options.file, "utf-8")
  .split("\n")
  .filter(Boolean);

// If --github is specified, check for contributions in the organization
if (options.github) {
  checkUserContributions(options.org, searchValues, false);
}

if (options.humaans) {
  // If --humaans is specified, just look up the GitHub usernames via Humaans
  (async () => {
    let newSearchValues = [];
    for (const value of searchValues) {
      const githubUsername = await humaansPeopleApiRequest(`email=${value}`);
      if (githubUsername) {
        newSearchValues.push(githubUsername);
        console.log(`GitHub username for ${value}: ${githubUsername}`);
      } else {
        console.log(`No GitHub username found for ${value}`);
      }
    }
    checkUserContributions(options.org, newSearchValues, false);
  })();
}
