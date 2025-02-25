#! /bin/bash

while IFS= read -r line
do
    if [[ "$line" == *"<script src"* ]]
    then
	   fn=`echo $line | sed 's/^.*src="\(.*\)">.*$/\1/g'`
	   echo "<script>"
	   cat $fn
	   echo "</script>"
    else
	   echo "$line"
    fi
done < base.html
