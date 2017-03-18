#/bin/bash
clear
while true
do
  node ../src/index.js
  #echo $?
  if [ $? -eq 3 ]; then
  node ../src/index.js
  else
  exit 0
  fi
  done
  
