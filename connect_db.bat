@echo off
title BCA Queue Database - PostgreSQL Terminal Shell
echo ======================================================================
echo   BCA Major Project: PostgreSQL Interactive Shell
echo   Database: bca_queue_db
echo   Host:     127.0.0.1:5432
echo   User:     postgres
echo ======================================================================
echo Useful commands:
echo   \dt             - List all tables
echo   \d table_name   - Describe table schema
echo   \q              - Quit psql
echo ======================================================================
echo.
"C:\Users\Anupam Baral\pgsql\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -d bca_queue_db
