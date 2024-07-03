#!/bin/sh

cd /app

if [ "$1" == "job1" ]; then
    /usr/local/bin/bun run src/index.ts
elif [ "$1" == "job2" ]; then
    /usr/local/bin/bun run src/delete.ts
else
    echo "Unknown job: $1"
fi

exec "$@"
