#!/bin/sh -l

set -eu

# Month without leading 0
currentMonth=$(date +%m | sed 's/^0//')

# Next version as YY.MM
nextTag=$(date +"%y.${currentMonth}")

# Tag - vYY.MM.PATCH from nextTag template
VERSION_REGEXP="^v${nextTag}\.([0-9]{1,2})$"

# Last git tag matching VERSION_REGEXP without 'v' prefix
lastTag=$(git tag --sort=v:refname | grep -E "${VERSION_REGEXP}" | tail -n 1 | tr -d 'v')

# Last tag major (YY.MM) and patch
lastTagMajor=$(echo "${lastTag}" | cut -d '.' -f 1-2)
lastTagPatch=$(echo "${lastTag}" | cut -d '.' -f 3)

if [ -n "${lastTagMajor}" ] && [[ "${lastTagMajor}" == "${nextTag}" ]]; then
    # Has tag with same major part - update patch part
    nextTag=${lastTagMajor}.$(( ${lastTagPatch} + 1 ))
else
    # New major version - use 0 as patch
    nextTag="${nextTag}.0"
fi

echo ${nextTag}
