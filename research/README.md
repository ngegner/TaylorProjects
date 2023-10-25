# Student Research
Computer science students at Taylor are required to do two semesters of professor-directed research as part of their degree. My research involves analyzing the projects of Sophomore computer science students taking Data Structures and Algorithms, with the hope of creating a tool able to estimate their progress on the projects they are given for their benefit. An Intellij IDE plugin created by my professor was used to gather project data from previous students. Included here is a subset of the work I've done this semester, exporting raw data into a json format that is easy to use for analytics. Example JSON output is held in `split_data.json`

## How to Run
`student_project_analysis.py` takes 3 arguments:
1. The name of the project to perform analysis on.
2. The name of the specific file to grab data from.
3. An indicator whether to load data (0), or process existing data (1) <= **You MUST choose 1**

Example input: `python3 student_project_analysis.py P01_Hex src/HexBoard.java 1`

NOTE: different analysis functionality can be added/removed from `stud_proj.py`
NOTE: Unfortunately, the load functionality cannot be run from this Git repo, because the cache holding the pickled data is ~4GB, so I cannot upload it.
