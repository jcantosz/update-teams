
base_dir=$PWD
for action_dir in */; do
  cd $action_dir
  npm test
  npm run build
  cd $base_dir
done