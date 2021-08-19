import React, { memo } from 'react';
import {
  Appbar,
  FAB,
  Snackbar,
  Title,
  Text,
  Caption,
} from 'react-native-paper';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  NativeModules,
} from 'react-native';
import ImagePicker from '../../components/ImagePicker';
import CustomToggleButton from '../../components/ToggleButton';

import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';

// ###
import CustomSwitch from '../../components/Switch';
import CustomSelect from '../../components/Select';
import FormTextInput from '../../components/FormTextInput';
import FormTextArea from '../../components/FormTextArea';
import NumberInput from '../../components/NumberInput';

import { defaultTheme } from '../../theme';
import * as actions from './actions';
import * as selectors from './selectors';
import { selectors as appSelectors, actions as appActions } from '../App';

const ImageCropPicker = NativeModules.ImageCropPicker;

const StockCheckListScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();

  const {
    params: {
      clId,
      itemId,
      clType,
      stockName,
      mechanic,
      quantity,
      barcode,
      sub_category,
      rental_type,
      shopName,
    },
  } = route;

  const isLoading = useSelector(selectors.makeSelectIsLoading());
  const isSubmitted = useSelector(selectors.makeSelectIsSubmitted());
  const errorMessage = useSelector(selectors.makeSelectErrorMessage());
  const template = useSelector(selectors.makeSelectTemplate(clId));
  const serverTime = useSelector(appSelectors.makeSelectServerTime());

  // const item = useSelector(selectors.makeSelectCheckListItemById(clId, itemId));
  const item = useSelector(selectors.makeSelectStockById(itemId));
  const [error, setError] = React.useState('');

  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors },
    clearErrors,
    trigger,
  } = useForm();

  React.useEffect(() => {
    if (!isLoading) {
      if (isSubmitted) {
        dispatch(actions.resetProps());
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } else {
        dispatch(appActions.getServerTime());
        if (errorMessage && errorMessage.length) {
          setError('Gửi lỗi không thành công');
        }
      }
    }

    return () => {
      ImageCropPicker.clean();
    };
  }, [isLoading, isSubmitted, navigation, errorMessage, dispatch]);

  const onSubmitCheckList = React.useCallback(
    (values) => {
      dispatch(actions.submit({ clId, itemId, data: values }));
    },
    [dispatch, itemId, clId],
  );

  const isOOS = clType.toLowerCase() === 'oos';
  const isRental = clType.toLowerCase() === 'rental';
  const isPromotion = clType.toLowerCase() === 'promotion';
  const isNpd = clType.toLowerCase() === 'npd';
  const isOsa = clType.toLowerCase() === 'osa weekend';
  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        />
        <Appbar.Content title={'Kiểm tra lỗi'} subtitle="" />
      </Appbar.Header>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView>
          <View style={styles.form}>
            <Title style={styles.caption}>{stockName}</Title>
            {isPromotion && (
              <View style={[styles.row, styles.textValue]}>
                <Caption style={styles.caption}>Mechanic</Caption>
                <Text>{mechanic}</Text>
              </View>
            )}
            {isOOS && (
              <View style={[styles.row, styles.textValue]}>
                <Caption style={styles.caption}>Stock</Caption>
                <Text>{quantity}</Text>
              </View>
            )}
            {(isOOS || isNpd || isPromotion || isOsa) && (
              <View style={[styles.row, styles.textValue]}>
                <Caption style={styles.caption}>Barcode</Caption>
                <Text>{barcode}</Text>
              </View>
            )}
            {isRental && (
              <>
                <View style={[styles.row, styles.textValue]}>
                  <Caption style={styles.caption}>Rental type</Caption>
                  <Text>{rental_type}</Text>
                </View>
                <View style={[styles.row, styles.textValue]}>
                  <Caption style={styles.caption}>Category</Caption>
                  <Text>{sub_category}</Text>
                </View>
              </>
            )}
            {Object.keys(template).map((fieldName) => {
              const type = template[fieldName].type;
              const required = template[fieldName].required;
              const defaultData = template[fieldName].default || '';
              let value = null;
              if (
                item &&
                item.data &&
                item.data[fieldName] &&
                item.data[fieldName] !== ''
              ) {
                value = item.data[fieldName];
              } else if (
                defaultData &&
                defaultData.field &&
                item[defaultData.field] &&
                item[defaultData.field] !== null
              ) {
                value = item[defaultData.field];
              } else if (defaultData && defaultData.value) {
                value = defaultData.value;
              } else {
                value = null;
              }

              if (type === 'number') {
                const { allow_negative } = template[fieldName];
                return (
                  <NumberInput
                    key={fieldName}
                    name={fieldName}
                    label={fieldName}
                    register={register}
                    setValue={setValue}
                    value={value !== null ? value.toString() : ''}
                    disabled={isLoading}
                    rules={{ required, min: !allow_negative && 0 }}
                    error={errors[fieldName]}
                    clearErrors={clearErrors}
                  />
                );
              }
              if (type === 'input') {
                return (
                  <FormTextInput
                    key={fieldName}
                    name={fieldName}
                    label={fieldName}
                    register={register}
                    setValue={setValue}
                    value={value !== null ? value.toString() : ''}
                    disabled={isLoading}
                    rules={{ required }}
                    error={errors[fieldName]}
                    clearErrors={clearErrors}
                  />
                );
              }
              if (type === 'checkbox') {
                return (
                  <CustomSwitch
                    register={register}
                    setValue={setValue}
                    name={fieldName}
                    label={fieldName}
                    key={fieldName}
                    rules={{ required }}
                    error={errors[fieldName]}
                    value={value !== null ? value : false}
                    disabled={isLoading}
                    clearErrors={clearErrors}
                  />
                );
              }
              if (type === 'select') {
                return (
                  <CustomSelect
                    key={fieldName}
                    options={template[fieldName].values.map((val) => {
                      return {
                        value: val,
                        label: val,
                        color:
                          item.data != null && item.data[fieldName] === val
                            ? 'purple'
                            : 'black',
                      };
                    })}
                    register={register}
                    setValue={setValue}
                    name={fieldName}
                    label={fieldName}
                    rules={{ required }}
                    error={errors[fieldName]}
                    value={value}
                    disabled={isLoading}
                    clearErrors={clearErrors}
                  />
                );
              }
              if (type === 'radio') {
                return (
                  <CustomToggleButton
                    options={template[fieldName].values}
                    register={register}
                    setValue={setValue}
                    name={fieldName}
                    label={fieldName}
                    key={fieldName}
                    rules={{ required }}
                    error={errors[fieldName]}
                    value={value !== null ? value.toString() : ''}
                    disabled={isLoading}
                    clearErrors={clearErrors}
                  />
                );
              }
              if (type === 'textarea') {
                return (
                  <FormTextArea
                    key={fieldName}
                    name={fieldName}
                    label={fieldName}
                    register={register}
                    setValue={setValue}
                    value={value !== null ? value.toString() : ''}
                    disabled={isLoading}
                    rules={{ required }}
                    error={errors[fieldName]}
                    clearErrors={clearErrors}
                  />
                );
              }
            })}

            {isRental && (
              <ImagePicker
                setValue={setValue}
                isSubmitting={isLoading}
                register={register}
                triggerValidation={trigger}
                value={item.data.photos || []}
                shopName={shopName}
                serverTime={serverTime}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <FAB
        visible={true}
        style={[styles.fab]}
        icon="check-all"
        label="Gửi"
        onPress={handleSubmit(onSubmitCheckList)}
        disabled={isLoading}
      />
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={4000}>
        {error}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultTheme.colors.background,
  },
  caption: {
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 16,
  },
  form: {
    paddingHorizontal: 16,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textValue: {
    paddingRight: 10,
  },
});

export default memo(StockCheckListScreen);
