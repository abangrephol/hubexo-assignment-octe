# Take Home Assignment for Glenigan Team

## Senior Software Engineer - Full Stack

This assignment is designed to judge your capability in contributing to our day-to-day software development workflow in Glenigan. We use a python and node js backend to serve REST API to our AngularJS (1.8.X) frontend, so this test is designed to mimic that workflow.

The assignment should not take more than **6 hours** to complete. We appreciate you taking your time to complete this assignment, and we aim to create an assignment that doesn't take up too much of your time. You are free to spread out your work across the four days (starting from the day you receive this assignment) allotted for submission.

We are assessing senior-level knowledge and practice. Parts of this assignment may sound strange, inconsistent, vague, or anti-pattern. We invite and expect you to reach out to us to clarify those parts.

Please direct your queries to alvin.megatroika@bcicentral.hubexo.com.

We also expect a compilation of your assumptions and design choices in a README.md (or directly in code comments where more appropriate).

Please send back the assignment to us in the form of a git archive (.zip).

---

## The Story

We manage many microservices that serve as backend endpoints for our frontend (web/mobile). One of the requests coming from userspace is to list construction projects filtered by an area. Your task is to write the endpoint that returns the data to the frontend and the frontend page that requests the data.

---

## Requirements

### Attached Assets

Alongside this assignment, you should also receive an SQLite database that you can use to query the information needed to form the response. Please explore the database to optimally finish your assignment.

---

## Endpoint

### Language

Please write the endpoint in **Python** or **Typescript** using any REST API framework that you're most comfortable with.

### Functional Requirements

The endpoint must adopt REST API practice, serving only GET requests. It needs to be able to consume the following query parameters:

1. **area** — to filter the projects by its area (optional)
2. **keyword** — to search by the project name (optional)
3. **page** — pagination parameter, 1-based
4. **per_page** — pagination parameter, how many projects per page to return

Both `page` and `per_page` are optional. If both are not passed, return all projects in the database.

The endpoint needs to return a JSON in the following format:

```json
[
  {
    "project_name": "Some Project Name",
    "project_start": "2026-01-01 00:00:00",
    "project_end": "2027-01-10 00:00:00",
    "company": "someCompany",
    "description": "text description",
    "project_value": 1234567,
    "area": "Some Area"
  }
]
```

> **Note:** `project_value` is in GBP (£).

### Non-Functional Context

Glenigan is popular among builders and construction companies. For each area, there may be thousands of construction projects happening at various stages. Many users also leverage our app to extract reports from these filtered project lists. These reports usually export all projects in an area into a single XLSX.

While you are not in charge of creating these reports, your endpoint may be used to retrieve the projects in a target area.

### Error Handling

Please handle errors sensibly and document your decisions in README.md.

At minimum, consider:

- Missing required query parameters (e.g. area)
- Invalid pagination values (non-numeric, zero, negative)
- Area not found / no projects found
- Project detail not found for a given project ID
- SQLite/database access error

You may choose your response JSON structure for errors (and for pagination metadata), but document it clearly.

---

## Frontend

### Language

Please use:

- **AngularJS 1.8.x** (legacy AngularJS)
- **Plain CSS** (or lightweight styling of your choice)
- **Typescript**

> This assignment is intentionally based on a legacy AngularJS stack, similar to parts of our brownfield environment.

### What to Build

#### 1. Project List Page

Build a page that displays a list of projects.

Each project item should show at least:

- Project Name
- Company
- Project Start
- Project End
- Project Value (GBP)
- Area

#### 2. Search / Filter

Add filtering controls to the list page:

- A **search bar** (free text) that filters by project name
- An **area filter** (dropdown or input)
- (Optional but nice) a **company filter**

You may decide whether filtering happens:

- instantly as the user types, or
- on button click

Document your choice in README.md.

---

## What We Expect

We are evaluating senior-level engineering judgment as much as code correctness.

We expect:

- A working codebase
- Reasonable handling of input parsing, pagination, and errors
- Clear code structure and maintainability
- A short README.md covering:
  - Assumptions
  - Design choices
  - Tradeoffs
  - How to run/test locally

If parts of the assignment look odd, vague, or suboptimal, we expect you to call that out and clarify with us.
