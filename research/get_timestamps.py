# Contains helper functions used to make time calculations based on the timestamp format


import sys
import pickle
import numpy as np
from datetime import datetime, timedelta
from time import strptime, mktime
# from intellijlog import Log


TIMESTAMP_FORMAT = '%Y.%m.%d.%H.%M.%S.%f'
PROJECT_NAMES = ['P01_Hex', 'P02_DataTypes', 'P03_Sorting', 'P04_Pathfinding', 'P05_KDTrees', 'P06_HollywoodCenter']


# NOTE: max_interval (default value = 30) is the maximum number of MINUTES allowed between two consectives timestamps in order for that interval to be added to the total time worked
def main():
    calc_timestamps_by_day('P01_Hex', 'src/HexBoard.java', 15)


def depickle() -> list:
    print('Loading... ', end='')
    sys.stdout.flush()
    all_logs = pickle.load(open('../cos265_sanitized_logs/test_cache_logs', 'rb'))
    print('done!')
    return all_logs


def get_timestamps(log) -> list:
    log = log.filedata
    timestamps = []
    for filename in log:
        ts = log[filename]['timestamps']
        for time in ts: timestamps.append('.'.join(time.split('.', 7)[:7]))       # only take numbers up to milliseconds
            
    return timestamps


def get_timestamps_for_file(log, file_name: str) -> list:
    log = log.filedata[file_name]
    timestamps = []
    ts = log['timestamps']
    for time in ts: timestamps.append('.'.join(time.split('.', 7)[:7]))

    return timestamps


def count_time(timestamps: list[datetime], max_interval=30) -> timedelta:
    total, prev_ts = 0, timestamps[0]
    for ts in timestamps:
        diff = (ts - prev_ts).total_seconds()
        if (diff / 60) <= max_interval: total += diff
        prev_ts = ts

    return timedelta(seconds=total)


def calc_avg_project_times(max_interval=30):
    ALL_LOGS, out = depickle(), open('results.txt', 'w')
    for project_name in PROJECT_NAMES:
        if not project_name == 'P01_Hex': continue
        logs = []
        for pname in sorted(ALL_LOGS.keys()):
            if not pname.endswith(project_name): continue
            logs += [ALL_LOGS[pname][logname] for logname in ALL_LOGS[pname]]

        all_times = []
        for log in logs:
            time = get_file_time_for_student(log, 'src/HexBoard.java')
            all_times.append(time)

        all_times = np.array(all_times)
        out.write(f'Time stats for {project_name} HexBoard.java (with a maximum interval of {max_interval} minutes) (h:m:s):\n')
        for time in all_times: out.write(f'\t{time}\n')
        out.write(f'\tAverage time for {project_name} HexBoard.java = {all_times.mean()}\n\n')

    out.close()


def calc_timestamps_by_day(project_name: str, file_name: str, max_interval: int=30):
    ALL_LOGS, out, logs = depickle(), open('results.txt', 'w'), list()
    for pname in sorted(ALL_LOGS.keys()):
        if pname.endswith(project_name):
            logs += [ALL_LOGS[pname][logname] for logname in ALL_LOGS[pname]]
            break

    all_times = []
    for log in logs:
        ts = get_timestamps_for_file(log, file_name)
        days = dict()
        for time in ts:
            split_time = time.split('.')
            date = f'{split_time[0]}/{split_time[1]}/{split_time[2]}'
            if date in days: days[date].append(time)
            else: days[date] = [time]

        days['total_time'] = ts
        all_times.append(days)

    for i,student in enumerate(all_times):
        out.write(f'times for student {i} by day')
        for day in student.keys():
            out.write(f'\n\t{day} = {_timestamps_to_timedelta(student[day])}')
        out.write('\n')

    out.close()


def get_time_for_student(log, max_interval: int=30) -> timedelta:
    timestamps = get_timestamps(log)
    return _timestamps_to_timedelta(timestamps)


def get_file_time_for_student(log, file_name: str, max_interval: int=30) -> timedelta:
    timestamps = get_timestamps_for_file(log, file_name)
    return _timestamps_to_timedelta(timestamps)


def get_time_up_to_point(log, idx: int, max_interval: int=30) -> timedelta:
    timestamps = get_timestamps(log)[:idx]
    return _timestamps_to_timedelta(timestamps)


def get_file_time_up_to_point(log, file_name: str, idx: int, max_interval: int=30) -> timedelta:
    timestamps = get_timestamps(log)[:idx]
    return _timestamps_to_timedelta(timestamps)


def _timestamps_to_timedelta(timestamps: list, max_interval: int=30) -> timedelta:
    sorted_ts = sorted(timestamps, key=lambda x: strptime(x, TIMESTAMP_FORMAT))     # <- see https://stackoverflow.com/questions/17627531/sort-list-of-date-strings
    to_datetime = [datetime.fromtimestamp(mktime(strptime(x, TIMESTAMP_FORMAT))) for x in sorted_ts]
    return count_time(to_datetime, max_interval)


if __name__ == '__main__':
    main()