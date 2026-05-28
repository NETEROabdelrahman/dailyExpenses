import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {
  createMigrate,
  FLUSH,
  MigrationManifest,
  PAUSE,
  PERSIST,
  PersistConfig,
  PersistedState,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import appReducer from './appSlice';

const rootReducer = combineReducers({
  app: appReducer,
});

type PersistedRootState = ReturnType<typeof rootReducer> & {
  app?: ReturnType<typeof appReducer> & {
    categoryLimits?: unknown;
  };
};

const migrations: MigrationManifest = {
  1: (state: PersistedState): PersistedState => {
    const nextState = {
      ...state,
    } as PersistedState & {
      app?: PersistedRootState['app'];
    };

    if (!nextState.app) {
      return state;
    }

    const nextApp = {...nextState.app};
    delete nextApp.categoryLimits;
    nextState.app = nextApp;
    return nextState;
  },
};

const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['app'],
  migrate: createMigrate(migrations, {debug: false}),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
