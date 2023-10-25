import get_timestamps as gt
import numpy as np
import Levenshtein
import json
from datetime import timedelta
from dataclasses import dataclass, field


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, JSONProjectState):
            return obj.__dict__
        if isinstance(obj, timedelta): return obj.total_seconds()
        return json.JSONEncoder.default(self, obj)
        

# TODO: consolidate import and export classes
@dataclass
class ProjectState:

    split: int
    last_state: str
    total_est_time: float
    est_split_time: float
    avg_nearest_dist: int
    avg_pred_time: float
    med_nearest_dist: int
    med_pred_time: float


@dataclass
class JSONProjectState:

    split: int
    total_est_time: float
    est_split_time: float
    avg_nearest_dist: int
    avg_pred_time: float
    med_nearest_dist: int
    med_pred_time: float

    def calc_med_prediction_error(self) -> float:
        total_pred_time = self.est_split_time + self.med_pred_time
        return (abs(total_pred_time - self.total_est_time) / self.total_est_time) * 100

    def calc_avg_prediction_error(self) -> float:
        total_pred_time = self.est_split_time + self.avg_pred_time
        return (abs(self.avg_pred_time - self.est_time) / self.est_time) * 100

    def calc_med_time_diff(self) -> float:
        total_pred_time = self.est_split_time + self.med_pred_time
        return total_pred_time - self.total_est_time    # returns negative if undershoot, positive if overshoot


@dataclass
class JSONStudentProject:

    idx: int
    file_name: str
    est_time: float
    proj_len: int
    splits: list = field(default_factory=list)

    def calc_med_prediction_errors(self) -> list:
        return [split.calc_med_prediction_error() for split in self.splits]

    def dynamic_time_pred(self, s: float = 1) -> None:
        scaler = 1.0

        for split in self.splits:
            split.med_pred_time *= scaler
            error = split.calc_med_prediction_error()
            scaler_change = error * s
            
            scaler = scaler - scaler_change if error > 1.0 else scaler + scaler_change

    def get_points_for_accuracy_vs_split(self) -> list:
        points = [[],[]]
        for split in self.splits:
            points[0].append(split.split)
            points[1].append(split.calc_med_prediction_error())

        return points

    def get_points_for_accuracy_vs_split_no_outliers(self, threshold: int = 500) -> list:
        points = [[],[]]
        for split in self.splits:
            accuracy = split.calc_med_prediction_error()
            if threshold < accuracy: raise ValueError('Project contains prediction that exceeds threshold')
            
            points[0].append(split.split)
            points[1].append(accuracy)

        return points

    def get_points_for_time_difference_no_outliers(self, threshold: float = 50000.0) -> list:
        points = [[],[]]
        for split in self.splits:
            diff = split.calc_med_time_diff()
            if threshold < diff: raise ValueError('Project contains prediction that exceeds threshold')

            points[0].append(split.split)
            points[1].append(diff)

        return points

    def get_points_for_time_difference(self) -> list:
        points = [[],[]]
        for split in self.splits:
            points[0].append(split.split)
            points[1].append(split.calc_med_time_diff())

        return points

    def get_points_for_time_difference_no_outliers(self, threshold: float = 50000.0) -> list:
        points = [[],[]]
        for split in self.splits:
            diff = split.calc_med_time_diff()
            if threshold < diff: raise ValueError('Project contains prediction that exceeds threshold')

            points[0].append(split.split)
            points[1].append(diff)

        return points


@dataclass
class StudentProject:

    idx: int
    file_name: str
    logs_ts: list
    est_time: float
    proj_len: int = 0
    splits: list = field(default_factory=list)


    def set_proj_len(self):
        self.proj_len = len(self.logs_ts[self.idx])

    def get_split_estimates(self, sorted_logs: list, skip_dist: int=2000) -> None:
        last_split, num_skipped, i, dist_skipped = '', 500, 500, 0

        while i < self.proj_len:
            ld = Levenshtein.distance(sorted_logs[self.idx][i-25][0], sorted_logs[self.idx][i][0])
            dist_skipped += ld
            if 500 <= num_skipped or skip_dist < dist_skipped:
                split_est = self.find_closest_point(sorted_logs[:], i)
                last_split = split_est.last_state
                self.splits.append(split_est)
                dist_skipped = 0
                num_skipped = 0
            else: num_skipped += 25
            
            i += 25


    def find_closest_point(self, sorted_logs: list, test_split: int=-1) -> ProjectState:
        if test_split > 0: sorted_logs[self.idx] = sorted_logs[self.idx][:test_split]
        LAST_STATE = sorted_logs[self.idx][-1][0]
        est_time_to_last_point = gt._timestamps_to_timedelta([state[1] for state in sorted_logs[self.idx]])

        nearest_states = list()
        for i,log in enumerate(sorted_logs):
            if i == self.idx:
                nearest_states.append(dict(dist=0, state='', idx=-1))
                continue    # don't compare to self

            cur_nearest_state, cur_nearest_dist, cur_state_idx = list(), float('inf'), -1
            for j,state in enumerate(log):
                d = Levenshtein.distance(state[0], LAST_STATE)
                if d <= cur_nearest_dist:
                    cur_nearest_dist, cur_nearest_state, cur_state_idx = d, state[0], j

            nearest_states.append(dict(dist=cur_nearest_dist, state=cur_nearest_state, idx=cur_state_idx))

        sum_time, sum_dist, nearest_times, nearest_dists = 0, 0, list(), list()
        for i,state in enumerate(nearest_states):
            if i == self.idx: continue      # don't compare to self

            ts = [s[1] for s in sorted_logs[i]]
            nearest_idx = state['idx']
            time_up_to_nearest_point = gt._timestamps_to_timedelta(ts[:nearest_idx]) if not nearest_idx == 0 else timedelta(seconds=0) 
            pred_time_to_go = self._predict_time(est_time_to_last_point, time_up_to_nearest_point, gt._timestamps_to_timedelta([s[1] for s in sorted_logs[i]]))
            if type(pred_time_to_go) == timedelta: pred_time_to_go = pred_time_to_go.total_seconds()

            sum_time += pred_time_to_go
            sum_dist += state['dist']
            nearest_times.append(pred_time_to_go)
            nearest_dists.append(state['dist'])

        num_states = len(nearest_states) - 1
        avg_time, avg_dist = sum_time / num_states, sum_dist / num_states

        nearest_times = np.array(nearest_times)
        med_time = np.median(nearest_times)

        nearest_dists = np.array(nearest_dists)
        med_dist = np.median(nearest_dists)

        return ProjectState(test_split, LAST_STATE, self.est_time, est_time_to_last_point, avg_dist, avg_time, med_dist, med_time)

    def _predict_time(self, time_to_last_point: timedelta, time_to_nearest_point: timedelta, nearest_project_time: timedelta) -> timedelta:
        percent_completed = time_to_nearest_point / nearest_project_time
        if percent_completed == 0: return nearest_project_time
        
        predicted_total_time = time_to_last_point / percent_completed
        return predicted_total_time - time_to_last_point

    def export_to_json(self, file):
        json_project = JSONStudentProject(self.idx, self.file_name, self.est_time, self.proj_len)
        json_project.splits = [JSONProjectState(split.split, split.total_est_time, split.est_split_time, split.avg_nearest_dist, split.avg_pred_time, split.med_nearest_dist, split.med_pred_time) for split in self.splits]
        
        json_obj = json.dumps(json_project.__dict__, cls=CustomJSONEncoder, indent=4)
        print(json_obj)
        file.write('\n')
        file.write(json_obj)

