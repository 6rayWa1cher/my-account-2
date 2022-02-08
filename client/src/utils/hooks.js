import { useCallback, useEffect, useMemo, useState } from "react";
import { unwrapResult } from "@reduxjs/toolkit";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

export const useMySnackbar = () => {
  const { enqueueSnackbar } = useSnackbar();

  const enqueueError = useCallback(
    (msg, params) => {
      console.error("Enqueued error", msg);
      enqueueSnackbar(msg, { ...params, variant: "error" });
    },
    [enqueueSnackbar]
  );

  const enqueueInfo = useCallback(
    (msg, params) => enqueueSnackbar(msg, { ...params, variant: "info" }),
    [enqueueSnackbar]
  );

  const enqueueWarning = useCallback(
    (msg, params) => enqueueSnackbar(msg, { ...params, variant: "warning" }),
    [enqueueSnackbar]
  );

  const enqueueSuccess = useCallback(
    (msg, params) => enqueueSnackbar(msg, { ...params, variant: "success" }),
    [enqueueSnackbar]
  );

  const enqueueDefault = useCallback(
    (msg, params) => enqueueSnackbar(msg, { ...params, variant: "default" }),
    [enqueueSnackbar]
  );

  return {
    enqueueDefault,
    enqueueError,
    enqueueInfo,
    enqueueSuccess,
    enqueueWarning,
    enqueueSnackbar,
  };
};

export const useGenericHandleBlurAction = (action, onFulfilled, onError) => {
  const dispatch = useDispatch();
  const { enqueueError } = useMySnackbar();

  const handleBlurAction = ({ setDisabled }) => {
    setDisabled(true);
    dispatch(action)
      .then(unwrapResult)
      .then((v) => {
        if (onFulfilled !== undefined) onFulfilled(v);
      })
      .catch((err) => {
        if (onError !== undefined) onError(err);
        else enqueueError(err.message);
      })
      .finally(() => {
        setDisabled(false);
      });
  };

  return handleBlurAction;
};

export const useParamSelector = (selector, params) => {
  return useSelector((state) => selector(state, params));
};

export const useQueryParams = () => {
  const { search } = useLocation();
  return useMemo(
    () => Object.fromEntries(new URLSearchParams(search).entries()),
    [search]
  );
};

export const UseLoadingEnum = Object.freeze({
  IDLE: 0,
  PENDING: 1,
  SUCCESS: 2,
  ERROR: 4,
});

export const useLoadingPlain = (
  asyncFunc,
  { immediate = true, enqueue = false, errorToMsg = null } = {}
) => {
  const [status, setStatus] = useState(UseLoadingEnum.IDLE);
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const { enqueueError } = useMySnackbar();

  // The execute function wraps asyncFunction and
  // handles setting state for pending, value, and error.
  // useCallback ensures the below useEffect is not called
  // on every render, but only if asyncFunction changes.
  const execute = useCallback(() => {
    setStatus(UseLoadingEnum.PENDING);
    setValue(null);
    setError(null);

    if (asyncFunc) {
      return asyncFunc()
        .then((response) => {
          setValue(response);
          setStatus(UseLoadingEnum.SUCCESS);
        })
        .catch((error) => {
          const msg = errorToMsg ? errorToMsg(error) : error;
          setError(msg);
          setStatus(UseLoadingEnum.ERROR);
          if (enqueue) {
            enqueueError(msg);
          }
        });
    }
  }, [asyncFunc, enqueueError, errorToMsg, enqueue]);

  // Call execute if we want to fire it right away.
  // Otherwise execute can be called later, such as
  // in an onClick handler.
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const loading = status === UseLoadingEnum.PENDING;
  const idle = status === UseLoadingEnum.IDLE;

  return {
    execute,
    status,
    value,
    error,
    loading,
    idle,
    bundle: { loading, error, status },
  };
};

export const useLoadingRedux = (
  actionCreator,
  { immediate = true, enqueue = false, errorToMsg = null, params = {} } = {}
) => {
  const stringParams = JSON.stringify(params); // DO NOT REMOVE THIS CAST! (useMemo thinks, that {} != {})
  const dispatch = useDispatch();
  const asyncFunc = useMemo(
    () =>
      actionCreator
        ? () =>
            dispatch(actionCreator(JSON.parse(stringParams))).then(unwrapResult)
        : null,
    [stringParams, actionCreator, dispatch]
  );
  return useLoadingPlain(asyncFunc, { immediate, enqueue, errorToMsg });
};

export const useEntityLoading = (
  idField,
  actionCreator,
  loadingParams = {}
) => {
  const params = useParams();
  const id = +params[idField];

  const loadingObj = useLoadingRedux(actionCreator, {
    params: { id },
    ...loadingParams,
  });

  return { [idField]: id, ...loadingObj };
};

export const useNumberParams = () => {
  const params = useParams();
  return Object.keys(params).reduce(
    (acc, c) => ({ ...acc, [c]: +params[c] }),
    {}
  );
};

export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = (title ? `${title} - ` : "") + "Fantasy Unicorn";
  }, [title]);
};
