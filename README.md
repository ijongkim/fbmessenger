# Facebook Messenger Bot

## Table of Contents
1. [About](#about)
1. [Requirements](#requirements)
1. [Development](#development)

## About

A Facebook Messenger Bot that allows you to create a list of pending tasks, mark tasks complete, and list completed tasks.

## Requirements
- Node
- NPM

## Development
- Clone repo to your local working directory
- Run `npm install`

## Demo of Core Functionality
- Go to `https://www.messenger.com/t/1942644119343536` and log in to interact with the bot
- You have the following commands available:
  - `/help` - Display the help message
  - `/list` - Display your current list of tasks
  - `/add <task description>` - Add this task to your list
  - `/done <list id>` - Mark this item complete
  - `/update <list id> <task description>` - Update this task with new task
  - `/delete <list id>` - Delete this task from your list
  - `/completed` - Display your completed list of tasks

## Schema Design

- Database has one table called `todo` with:
  - `id` INT PRIMARY KEY
  - `user_id` VARCHAR 250 NOT NULL
  - `created_timestamp` TIMESTAMP DEFAULT now() NOT NULL
  - `last_updated` TIMESTAMP DEFAULT now() NOT NULL
  - `item` VARCHAR 250 NOT NULL
  - `completed` BOOLEAN DEFAULT FALSE

## To Do
- Add ability to use tags, allowing user to filter by tags
- Add search functionality
- Implement NLP for more natural interaction
- Utilize FB's message templates

## Tests Overview
- With the time available, no tests were written. Ideally, tests for database connectivity and all database queries are tested, both GET and POST endpoints would be tested.
