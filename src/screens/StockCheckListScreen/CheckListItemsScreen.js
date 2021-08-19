import React, { memo } from 'react';
import {
  Appbar,
  useTheme,
  List,
  Divider,
  Searchbar,
  IconButton,
  Dialog,
  Portal,
  RadioButton,
  Button,
  Caption,
  FAB,
  Switch,
} from 'react-native-paper';
import { StyleSheet, View, FlatList, ScrollView, Platform } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { isEmpty } from 'lodash';

import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PenNote } from '../../assets/icons';

import { defaultTheme } from '../../theme';
import * as selectors from './selectors';
import { logger, useDebounce } from '../../utils';
import * as actions from './actions';
import { selectors as checkInSelectors } from '../CheckInScreen';

const CheckListItemsScreen = ({ navigation, route }) => {
  const safeArea = useSafeArea();
  const { colors } = useTheme();
  const dispatch = useDispatch();

  const {
    params: { clId, shopId, clType, shopName },
  } = route;

  const stocks = useSelector(selectors.makeSelectStocks());
  const categories = useSelector(selectors.makeSelectCategoriesOfStocks());
  logger('CheckListItemsScreen -> stocks', stocks);
  const isLoading = useSelector(selectors.makeSelectIsLoading());
  const isSubmitted = useSelector(selectors.makeSelectIsSubmitted());
  const checkInData = useSelector(checkInSelectors.makeSelectCheckInData());

  const [visibleFilter, setVisibleFilter] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState('');
  const [filterValue, setFilterValue] = React.useState('');
  const [searchText, setSearchText] = React.useState('');
  const [isFocusSearchInput, setIsFocusSearchInput] = React.useState(false);
  const debounceSearchTerm = useDebounce(searchText, 1000);
  const [toIndex, setToIndex] = React.useState(0);
  const [isDone, setIsDone] = React.useState(false);

  const searchRef = React.createRef();
  const flatListRef = React.useRef(null);

  const [openFAB, setOpenFAB] = React.useState(false);

  React.useEffect(() => {
    dispatch(
      actions.fetchStocks({
        search: debounceSearchTerm,
        checkListId: clId,
        filter: filterValue,
        isDone,
      }),
    );
  }, [debounceSearchTerm, clId, dispatch, filterValue, isDone]);

  const getItemLayout = (data, index) => {
    const itemHeight = 80;
    return { length: itemHeight, offset: itemHeight * index, index };
  };

  React.useEffect(() => {
    if (!isLoading) {
      if (isSubmitted) {
        dispatch(actions.resetProps());
      }
    }
  }, [isLoading, isSubmitted, dispatch]);

  const onSubmitCheckList = React.useCallback(
    (item) => {
      dispatch(
        actions.submit({ isDefault: true, clId, itemId: item.id, data: item }),
      );
    },
    [dispatch, clId],
  );

  const renderItem = ({ item, index }) => {
    return (
      <List.Item
        style={{
          height: 80,
          paddingVertical: 10,
        }}
        title={item.stock_name}
        titleNumberOfLines={2}
        titleStyle={{ fontSize: 14, height: '70%' }}
        description={() =>
          clType === 'oos' && (
            <View style={styles.rowItem}>
              <Caption>{`Stock: ${item.quantity}`}</Caption>
              {item.data && item.data !== null && (
                <>
                  <Caption>{`Available: ${
                    item.data.Available ? item.data.Available : ''
                  }`}</Caption>
                  <Caption>{`Void: ${
                    item.data.Void ? item.data.Void : ''
                  }`}</Caption>
                </>
              )}
            </View>
          )
        }
        onPress={() => {
          setToIndex(index);
          navigation.navigate('FormScreen', {
            shopName: checkInData.name ? checkInData.name : shopName,
            itemId: item.id,
            clId,
            shopId,
            clType,
            stockName: item.stock_name,
            mechanic: item.mechanic,
            barcode: item.barcode,
            quantity: item.quantity,
            rental_type: item.rental_type ? item.rental_type : null,
            sub_category: item.sub_category ? item.sub_category : null,
          });
        }}
        right={(props) =>
          !isEmpty(item.data) ? (
            <List.Icon {...props} icon="check-circle" color="green" />
          ) : clType === 'oos' ? (
            <IconButton
              icon="upload"
              size={20}
              onPress={() => {
                onSubmitCheckList(item);
                setToIndex(index);
              }}
            />
          ) : (
            <List.Icon
              {...props}
              icon={() => <PenNote width="100%" fill="black" />}
            />
          )
        }
      />
    );
  };

  const keyExtractor = (item) => item.id.toString();

  const _onSearchStockItem = (text) => {
    setSearchText(text);
  };

  const _onFocus = () => {
    setIsFocusSearchInput(true);
  };
  const _onBlur = () => {
    setIsFocusSearchInput(false);
  };
  const _onIconPress = () => {
    searchRef.current && searchRef.current.blur();
  };

  const _onPressGoBack = React.useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const showDialog = () => setVisibleFilter(true);

  const hideDialog = () => {
    setVisibleFilter(false);
  };

  const submitFilter = () => {
    setSelectedOption(selectedOption);
    setFilterValue(selectedOption);
    setVisibleFilter(false);
  };

  const clearFilter = () => {
    setSelectedOption('');
    setFilterValue('');
    setVisibleFilter(false);
  };

  const changeOption = (value) => {
    setSelectedOption(value);
  };

  const scrollToIndex = React.useCallback(
    (index) => {
      flatListRef &&
        flatListRef.current &&
        flatListRef.current.scrollToIndex({ animated: true, index });
    },
    [flatListRef],
  );

  React.useEffect(() => {
    if (toIndex > 0) {
      scrollToIndex(toIndex);
    }
  }, [scrollToIndex, toIndex]);

  const onToggleFilter = () => {
    setIsDone(!isDone);
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={_onPressGoBack} disabled={isLoading} />
        <Appbar.Content title={'Sản phẩm'} subtitle="" />
      </Appbar.Header>
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          <View style={styles.row}>
            <Searchbar
              placeholder="Tìm kiếm..."
              onChangeText={_onSearchStockItem}
              value={searchText}
              style={styles.searchbar}
              icon={isFocusSearchInput ? 'keyboard-backspace' : 'magnify'}
              onFocus={_onFocus}
              onBlur={_onBlur}
              onIconPress={_onIconPress}
              ref={searchRef}
              autoCorrect={false}
              autoCompleteType="off"
              spellCheck={false}
            />
            <Switch value={isDone} onValueChange={onToggleFilter} />

            <IconButton
              icon="filter"
              color="gray"
              size={20}
              onPress={showDialog}
            />
          </View>
          <View style={[styles.container]}>
            <FlatList
              ref={flatListRef}
              data={stocks}
              renderItem={renderItem}
              getItemLayout={getItemLayout}
              ItemSeparatorComponent={Divider}
              keyExtractor={keyExtractor}
              contentContainerStyle={{
                backgroundColor: colors.background,
                paddingBottom: safeArea.bottom,
              }}
              initialNumToRender={15}
              initialScrollIndex={toIndex > stocks.length ? 0 : toIndex}
            />
          </View>
          <Portal>
            <Dialog visible={visibleFilter} onDismiss={hideDialog}>
              <Dialog.Title>Filter by</Dialog.Title>
              <Dialog.ScrollArea style={{ maxHeight: '90%' }}>
                <ScrollView>
                  <RadioButton.Group
                    onValueChange={(value) => changeOption(value)}
                    value={selectedOption}>
                    {categories &&
                      categories.length > 0 &&
                      categories.map((item) => (
                        <RadioButton.Item
                          key={item}
                          label={item}
                          value={item}
                        />
                      ))}
                  </RadioButton.Group>
                </ScrollView>
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button color="red" onPress={clearFilter}>
                  Clear
                </Button>
                <Button onPress={submitFilter}>Done</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </>
      )}

      <FAB.Group
        icon={openFAB ? 'close' : 'format-list-bulleted-type'}
        onPress={() => {}}
        onStateChange={({ open }) => setOpenFAB(open)}
        open={openFAB}
        actions={[
          {
            icon: 'camera',
            label: 'Chụp hình',
            onPress: () => {
              navigation.navigate('ShopCaptureScreen', {
                shopId: checkInData.shop_id,
                shopName: checkInData.name ? checkInData.name : shopName,
              });
            },
          },
        ]}
        visible={true}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultTheme.colors.background,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: defaultTheme.colors.background,
  },
  searchbar: {
    margin: 4,
    flex: 1,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  rowItem: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    display: 'flex',
    alignItems: 'center',
  },
});

export default memo(CheckListItemsScreen);
