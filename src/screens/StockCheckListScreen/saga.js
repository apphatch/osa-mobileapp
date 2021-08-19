import { put, call, select, all, takeLatest, delay } from 'redux-saga/effects';
import { mapValues, isEmpty } from 'lodash';

import * as actions from './actions';
import * as actionTypes from './actionTypes';

// ## API
import * as API from './services';
import * as selectors from './selectors';

import { logger } from '../../utils';

import {
  selectors as loginSelectors,
  actions as loginActions,
} from '../LoginScreen';

export function* submitCheckList({ payload }) {
  const { clId, itemId, isDefault = false } = payload;
  let { data } = payload;
  try {
    yield delay(0);
    const formData = new FormData();

    const authorization = yield select(
      loginSelectors.makeSelectAuthorization(),
    );

    if (isDefault) {
      const currentCl = yield select(selectors.makeSelectCheckListById(clId));
      const { template } = currentCl;
      data = mapValues(template, (o) => {
        if (o.default && data[o.default.field]) {
          return data[o.default.field].toString();
        }
        if (o.default && data[o.default.value]) {
          return data[o.default.value].toString();
        }
        return '';
      });
    }
    formData.append('data', JSON.stringify(data));

    const res = yield call(API.submitCheckListItemData, {
      itemId,
      data: formData,
      authorization,
    });

    yield put(actions.submitSuccess({ clId, itemId, data }));
    yield put(loginActions.updateAuthorization(res.headers.authorization));
  } catch (error) {
    console.log('function*submitCheckList -> error', error);
    yield put(actions.submitFailed(error.message));
  }
}

export function* fetchCheckList({ payload }) {
  try {
    yield delay(0);
    const authorization = yield select(
      loginSelectors.makeSelectAuthorization(),
    );
    const { shopId } = payload;
    const response = yield call(API.fetchCheckList, {
      shopId,
      authorization,
    });

    yield put(actions.checkListResponse({ checkList: response.data }));
    yield put(loginActions.updateAuthorization(response.headers.authorization));
  } catch (error) {
    console.log('function*fetchCheckList -> error', error);
    yield put(actions.fetchCheckListFailed(error.message));
  }
}

export function* markDoneAllCheckListItems({ payload: { clId, clType } }) {
  try {
    yield delay(0);
    const stocksHasDataNull = yield select(
      selectors.makeSelectStocksHasDataNull(),
    );
    const authorization = yield select(
      loginSelectors.makeSelectAuthorization(),
    );
    const currentCl = yield select(selectors.makeSelectCheckListById(clId));
    const { template } = currentCl;
    let data = [];
    const formData = new FormData();

    if (currentCl.checklist_type.toUpperCase() === 'OOS') {
      data = stocksHasDataNull.map((item) => {
        return {
          id: item.id,
          data: mapValues(template, (o) => {
            if (o.type === 'select') {
              return o.values[0];
            }
            return '';
          }),
        };
      });
    } else {
      data = stocksHasDataNull.map((item) => {
        return {
          id: item.id,
          data: mapValues(template, (o) => {
            if (o.type === 'input') {
              return '';
            }
            return '';
          }),
        };
      });
    }
    logger('function*markDoneAllCheckListItems -> data', data);
    formData.append('checklist_items', JSON.stringify(data));
    const res = yield call(API.markDoneAll, {
      data: formData,
      authorization,
      clId,
    });
    yield put(actions.markDoneAllSuccess());
    yield put(loginActions.updateAuthorization(res.headers.authorization));
    yield put(actions.fetchStocks({ search: '', checkListId: clId }));
  } catch (error) {
    yield put(actions.markDoneAllFailed(error.message));
  }
}

export function* fetchStocks({ payload }) {
  try {
    yield delay(0);
    const authorization = yield select(
      loginSelectors.makeSelectAuthorization(),
    );
    const { filter, isDone } = payload;
    const res = yield call(API.fetchStockByCheckList, {
      ...payload,
      authorization,
    });
    let categories = [];
    res.data.forEach(function (item) {
      var existing = categories.filter(function (v, i) {
        return v === item.category;
      });
      if (existing.length <= 0) {
        categories.push(item.category);
      }
    });

    res.data.sort((a, b) => {
      if (a.category === b.category) {
        if (a.sub_category === b.sub_category) {
          return a.stock_name > b.stock_name ? 1 : -1;
        }
        return a.sub_category > b.sub_category ? 1 : -1;
      }
      return a.category > b.category ? 1 : -1;
    });

    let newData = res.data;
    if (filter !== '') {
      newData = newData.filter((item) => item.category === filter);
    }
    if (isDone) {
      newData = newData.filter((item) => isEmpty(item.data));
    }
    yield put(actions.stocksResponse({ stocks: newData, categories }));
    yield put(loginActions.updateAuthorization(res.headers.authorization));
  } catch (error) {
    yield put(actions.fetchStocksFailed(error.message));
  }
}

export default function root() {
  return function* watch() {
    yield all([
      yield takeLatest(actionTypes.SUBMIT, submitCheckList),
      yield takeLatest(actionTypes.FETCH_CHECK_LIST, fetchCheckList),
      yield takeLatest(actionTypes.MARK_DONE_ALL, markDoneAllCheckListItems),
      yield takeLatest(actionTypes.FETCH_STOCKS, fetchStocks),
    ]);
  };
}
