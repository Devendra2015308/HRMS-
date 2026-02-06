#!/usr/bin/env bash
set -e

cd backend

python manage.py migrate --noinput

gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
