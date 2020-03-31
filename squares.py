#!/usr/bin/env python

import numpy as np
import cv2 as cv
from sklearn.cluster import AgglomerativeClustering
import argparse


def angle_cos(p0, p1, p2):
    d1, d2 = (p0 - p1).astype('float'), (p2 - p1).astype('float')
    return abs(np.dot(d1, d2) / np.sqrt(np.dot(d1, d1) * np.dot(d2, d2)))


def find_rectangles(img):
    img = cv.GaussianBlur(img, (5, 5), 0)
    squares = []
    for gray in cv.split(img):
        for thrs in range(0, 255, 26):
            if thrs == 0:
                bin = cv.Canny(gray, 0, 50, apertureSize=5)
                bin = cv.dilate(bin, None)
            else:
                _retval, bin = cv.threshold(gray, thrs, 255, cv.THRESH_BINARY)
            contours, _hierarchy = cv.findContours(bin, cv.RETR_LIST,
                                                   cv.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                cnt_len = cv.arcLength(cnt, True)
                cnt = cv.approxPolyDP(cnt, 0.02 * cnt_len, True)
                if len(cnt) == 4 and cv.contourArea(
                        cnt) > 1000 and cv.isContourConvex(cnt):
                    cnt = cnt.reshape(-1, 2)
                    max_cos = np.max([
                        angle_cos(cnt[i], cnt[(i + 1) % 4], cnt[(i + 2) % 4])
                        for i in range(4)
                    ])
                    if max_cos < 0.1:
                        squares.append(cnt)
    return squares


def only_squares(squares):
    edge_lens = list()

    for sq in squares:
        for i in range(3):
            edge_lens.append(np.linalg.norm(sq[i] - sq[(i + 1) % 4]))

    median_len = np.median(edge_lens)

    def len_ok(sq):
        for i in range(3):
            edge_len = np.linalg.norm(sq[i] - sq[(i + 1) % 4])
            if edge_len > (1.3) * median_len or edge_len < (0.7) * median_len:
                return False

        return True

    return [sq for sq in squares if len_ok(sq)], median_len


def deduplicate(squares, median_len):
    points = np.array(squares).reshape((-1, 2))
    points = np.unique(points, axis=0)

    cluster = AgglomerativeClustering(distance_threshold=median_len * 0.7,
                                      affinity='euclidean',
                                      linkage='ward',
                                      compute_full_tree=True,
                                      n_clusters=None)
    cluster.fit_predict(points)

    n_clusters = np.unique(cluster.labels_).shape[0]
    c_means = np.zeros((n_clusters, 2))
    for i in range(n_clusters):
        c_means[i] = np.mean(points[cluster.labels_ == i], axis=0)

    def closest_node(i):
        dist_2 = np.sum(
            (c_means[np.arange(len(c_means)) != i] - c_means[i])**2, axis=1)
        return np.sqrt(np.min(dist_2))

    assert min(closest_node(n) for n in range(len(c_means))) > 90

    return c_means


def complete_points(points, median_len):
    pts_ord = sorted(points, key=lambda x: x[1])

    rows = []
    i = 0
    while i < len(pts_ord):
        row_first = pts_ord[i]
        i += 1
        rows.append([row_first])

        while i < len(pts_ord) and \
                np.abs(pts_ord[i][1] - row_first[1]) < median_len * 0.5:
            rows[-1].append(pts_ord[i])
            i += 1

    for r in range(len(rows)):
        rows[r] = sorted(rows[r], key=lambda x: x[0])

    rows2 = [list() for _ in range(len(rows))]
    for r in range(len(rows)):
        for c in range(len(rows[r])):
            pt = rows[r][c]
            if c == 0 and r != 0:
                pt_above = rows2[r - 1][0]
                if np.abs(pt_above[0] - pt[0]) > median_len * 0.5:
                    rows2[r].append(np.array([pt_above[0], pt[1]]))
            elif c != 0:
                pt_prev = rows[r][c - 1]
                if np.abs(pt_prev[0] - pt[0]) > (median_len * 1.6):
                    rows2[r].append(np.array([(pt_prev[0] + pt[0]) / 2,
                                              pt[1]]))

            rows2[r].append(pt)

            if c == (len(rows[r]) - 1) and r != 0:
                pt_above = rows2[r - 1][-1]
                diff = pt_above[0] - pt[0]
                if diff > median_len * 1.5 and diff < median_len * 3:
                    rows2[r].append(np.array([rows2[r - 1][-2][0], pt[1]]))

                if diff > median_len * 0.5 and diff < median_len * 3:
                    rows2[r].append(np.array([pt_above[0], pt[1]]))

    return rows2


def squares_from_points(points):
    final_sqs = []
    for r in range(len(points) - 1):
        row_sqs = []
        c = 0
        while c < len(points[r]) - 1 and c < (len(points[r + 1]) - 1):
            row_sqs.append(
                np.array([
                    points[r][c],
                    points[r][c + 1],
                    points[r + 1][c + 1],
                    points[r + 1][c],
                ],
                         dtype=np.int32))
            c += 1

        final_sqs.append(row_sqs)
    return final_sqs


def get_text_squares(squares, img):
    img2 = img.copy()
    gray = cv.cvtColor(img2, cv.COLOR_BGR2GRAY)
    thresh, im_bw = cv.threshold(gray, 128, 255,
                                 cv.THRESH_BINARY | cv.THRESH_OTSU)

    has_text = []
    for r in squares:
        has_text.append(list())
        for cnt in r:
            x, y, w, h = cv.boundingRect(cnt)
            avg = np.mean(im_bw[y + 15:y + h - 15, x + 15:x + w - 15])

            has_text[-1].append(avg < 251)
    return has_text


def show(img, scale_percent=20):
    width = int(img.shape[1] * scale_percent / 100)
    height = int(img.shape[0] * scale_percent / 100)
    dim = (width, height)
    # resize image
    res = cv.resize(img, dim, interpolation=cv.INTER_AREA)

    cv.imshow('squares', res)
    ch = cv.waitKey()

    print('Done')
    cv.destroyAllWindows()


def get_squares(img_path):
    print(f'Reading img: {img_path}')
    img = cv.imread(img_path)
    squares, median_len = only_squares(find_rectangles(img))
    squares = np.array(squares)

    points = deduplicate(squares, median_len)

    points = complete_points(points, median_len)

    squares = squares_from_points(points)
    has_text = get_text_squares(squares, img)

    return squares, has_text


def visualize(img_path, squares, has_text):
    cont_text = []
    cont_empty = []
    for i in range(len(squares)):
        for j in range(len(squares[i])):
            if has_text[i][j]:
                cont_text.append(squares[i][j])
            else:
                cont_empty.append(squares[i][j])

    img = cv.imread(img_path)
    cv.drawContours(img, cont_empty, -1, (0, 0, 255), 3)
    cv.drawContours(img, cont_text, -1, (0, 255, 0), 3)

    show(img)


if __name__ == '__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument('-v',
                        dest='visualize',
                        default=False,
                        action='store_true',
                        help='visualize')
    parser.add_argument('image', nargs=1, help='Path to crossword image')

    args = parser.parse_args()

    squares, has_text = get_squares(args.image[0])
    if args.visualize:
        visualize(args.image[0], squares, has_text)
