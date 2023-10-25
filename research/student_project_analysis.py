import sys
import pickle
import Levenshtein
import json
import numpy as np
import get_timestamps
import matplotlib.pyplot as plt
from time import strptime
from stud_proj import StudentProject, JSONProjectState, JSONStudentProject


def get_logs(proj_name: str) -> list:
    all_logs = pickle.load(open('../cos265_sanitized_logs/test_cache_logs','rb'))

    logs = []
    for pname in sorted(all_logs.keys()):
        if not pname.endswith(proj_name): continue
        logs += [all_logs[pname][logname] for logname in all_logs[pname]]  

    return logs


def sort_logs_and_get_time(logs: list, comp_idx: int, file_name: str) -> tuple:
    sorted_logs = [sorted(zip(log.filedata[file_name]['versions'], get_timestamps.get_timestamps_for_file(log, file_name)), key=lambda pair: strptime(pair[1], get_timestamps.TIMESTAMP_FORMAT)) for log in logs]
    time_to_last_point = get_timestamps._timestamps_to_timedelta([state[1] for state in sorted_logs[comp_idx]])
    return (sorted_logs, time_to_last_point, len(sorted_logs[comp_idx]))


def plot_multi_project_graph(points: list, title: str, xlabel: str, ylabel: str):
    num_plots = len(points)
    colormap = plt.cm.gist_ncar
    plt.gca().set_prop_cycle(plt.cycler('color', plt.cm.jet(np.linspace(0,1,num_plots))))
    
    for point in points: 
        plt.plot(point[0], point[1])

    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    # plt.show()
    plt.savefig(title)
    plt.close()


def load_json_file(file_name) -> list:
    try:
        file = open(file_name, 'r')
    except:
        print('invalid file name')
        raise FileNotFoundError()

    json_dict, projects = json.load(file), list()
    for student_project in json_dict:
        proj_states = [JSONProjectState(**split) for split in student_project['splits']]
        del student_project['splits']
        projects.append(JSONStudentProject(**student_project, splits=proj_states))

    return projects


def load_student_project_json(file_name: str, idx: int) -> StudentProject:
    try:
        file = open(file_name, 'r')
    except:
        print('invalid file name')
        raise FileNotFoundError()

    json_dict, i = json.load(file), 0
    for student_project in json_dict:
        if not i == idx:
            i += 1
            continue

        proj_states = [JSONProjectState(**split) for split in student_project['splits']]
        del student_project['splits']
        return JSONStudentProject(**student_project, splits=proj_states)


def populate_data_json(project_name: str, proj_file_name: str, out_file_name: str) -> None:
    LOGS = get_logs(project_name)

    with open(out_file_name, 'w') as file:
        for i in range(len(LOGS)):
            sorted_logs, est_time, proj_len = sort_logs_and_get_time(LOGS, i, proj_file_name)
            sp = StudentProject(i, proj_file_name, sorted_logs, est_time.total_seconds())
            sp.set_proj_len()
            sp.get_split_estimates(sorted_logs)
            sp.export_to_json(file)


# %%
# Params:
#   project name
#   file name
#   test log idx
def main():
    if not len(sys.argv) == 4:
        print(f'usage: {sys.argv[0]} [project name] [file name] [0 (load)/1 (plot)]')
        sys.exit(1)

    _, PROJ_NAME, FILE_NAME, LOAD = sys.argv

    if int(LOAD) == 0: populate_data_json(PROJ_NAME, FILE_NAME, 'split_data.json')

    else:
        test = load_json_file('split_data.json')
        for project in test: project.dynamic_time_pred()
        points = [project.get_points_for_accuracy_vs_split() for project in test]
        plot_multi_project_graph(points, 'accuracy_vs_splits_dynamic.pdf', 'Number of Snapshots', 'Percent error')


if __name__ == '__main__':
    main()