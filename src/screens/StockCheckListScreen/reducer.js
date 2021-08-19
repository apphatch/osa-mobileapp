import { createReducer } from '../../utils';
import * as actionTypes from './actionTypes';

const initialState = {
  isLoading: false,
  errorMessage: '',
  checkList: [],
  stocks: [],
  isSubmitted: false,
  isDoneAll: false,
};

const handlers = {
  [actionTypes.MARK_DONE_ALL]: markDoneAll,
  [actionTypes.MARK_DONE_ALL_RESPONSE]: markDoneAllSuccess,
  [actionTypes.MARK_DONE_ALL_FAILED]: markDoneAllFailed,

  [actionTypes.SUBMIT]: submit,
  [actionTypes.SUBMIT_SUCCESS]: submitSuccess,
  [actionTypes.SUBMIT_FAILED]: submitFailed,

  [actionTypes.CHECK_LIST_RESPONSE]: checkListResponse,

  [actionTypes.FETCH_STOCKS]: fetchStocks,
  [actionTypes.FETCH_STOCKS_RESPONSE]: stocksResponse,
  [actionTypes.FETCH_STOCKS_FAILED]: fetchStocksFailed,

  [actionTypes.RESET_PROPS]: resetProps,
};

export default createReducer(initialState, handlers);

function submit(state, action) {
  state.isLoading = true;
  state.isSubmitted = false;
  state.errorMessage = '';
}

function submitSuccess(state, action) {
  state.isLoading = false;
  state.isSubmitted = true;
  const { clId, itemId, data } = action.payload;
  state.checkList = state.checkList.map((cl) => {
    if (cl.id === clId) {
      cl.checklist_items = cl.checklist_items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            data,
          };
        }
        return item;
      });
      const filterCompleted = cl.checklist_items.filter(
        (item) => item.data === null || item.data === {},
      );
      return {
        ...cl,
        completed: filterCompleted.length > 0 ? false : true,
      };
    }
    return cl;
  });
  state.stocks = state.stocks.map((stock) => {
    if (stock.id === itemId) {
      return {
        ...stock,
        data,
      };
    }
    return stock;
  });
}
function submitFailed(state, action) {
  state.isLoading = false;
  state.isSubmitted = false;
  state.errorMessage = action.payload.errorMessage;
}

function checkListResponse(state, action) {
  state.isLoading = false;
  state.checkList = action.payload.checkList;
}

function fetchStocks(state, action) {
  state.isLoading = true;
}

function stocksResponse(state, action) {
  state.isLoading = false;
  state.stocks = action.payload.stocks;
  state.categories = action.payload.categories;
}

function fetchStocksFailed(state, action) {
  state.isLoading = false;
  state.stocks = [];
}

function resetProps(state, action) {
  state.isLoading = false;
  state.errorMessage = '';
  state.isSubmitted = false;
  state.isDoneAll = false;
}

function markDoneAll(state, action) {
  state.isLoading = true;
}
function markDoneAllSuccess(state, action) {
  state.isLoading = false;
  state.isDoneAll = true;
}
function markDoneAllFailed(state, action) {
  state.isLoading = false;
}
