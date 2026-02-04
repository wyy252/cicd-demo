FROM mysql:8.0

COPY schema.sql /docker-entrypoint-initdb.d/schema.sql
COPY seed.sql /docker-entrypoint-initdb.d/seed.sql
