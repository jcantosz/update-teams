# Gets all current teams in the org and puts them in the folder/file structure used by these actions

ORG="<>"
# Get teams for org
TEAM_LIST=$(mktemp)
gh api --paginate \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /orgs/${ORG}/teams --jq '.[].slug' > ${TEAM_LIST}

for team in $(cat ${TEAM_LIST}); do
  mkdir -p ${team}
  # Get members
  gh api --paginate \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    /orgs/${ORG}/teams/${team}/members --jq '.[].login' > ${team}/users
  # Get repos
  gh api --paginate \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      /orgs/${ORG}/teams/${team}/repos --jq '.[] |  "\(if (.permissions.admin) then "admin" elif (.permissions.maintain) then "maintain" elif (.permissions.push) then "push" elif (.permissions.triage) then "triage" else "pull" end) \(.full_name)"' > ${team}/repositories
done

rm -f ${TEAM_LIST}
