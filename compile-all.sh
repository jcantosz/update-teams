
base_dir=$PWD
for action_dir in {aad-user-sync,create-teams-from-directories,sync-repositories,sync-users}; do
  cd $action_dir
  npm test
  npm run build
  cd $base_dir
done