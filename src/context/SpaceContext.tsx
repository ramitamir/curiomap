'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, CurioSpace, Manifestation, Axis } from '@/lib/types';

// Action types
type Action =
  | { type: 'CREATE_SPACE'; payload: { subject: string; xAxis: Axis; yAxis: Axis } }
  | { type: 'UPDATE_AXIS'; payload: { axisId: 'x' | 'y'; updates: Partial<Axis> } }
  | { type: 'ADD_MANIFESTATION'; payload: Manifestation }
  | { type: 'REPLACE_MANIFESTATION'; payload: Manifestation }
  | { type: 'LOAD_SPACE'; payload: CurioSpace }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_COORDINATE'; payload: { x: number; y: number } | null };

// Initial state
const initialState: AppState = {
  currentSpace: null,
  isGenerating: false,
  selectedCoordinate: null,
  error: null,
};

// Reducer function
function spaceReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_SPACE': {
      const { subject, xAxis, yAxis } = action.payload;
      const now = new Date().toISOString();
      const newSpace: CurioSpace = {
        id: uuidv4(),
        version: '1.0',
        subject,
        xAxis,
        yAxis,
        manifestations: [],
        createdAt: now,
        lastModified: now,
      };
      return {
        ...state,
        currentSpace: newSpace,
        error: null,
      };
    }

    case 'UPDATE_AXIS': {
      if (!state.currentSpace) return state;

      const { axisId, updates } = action.payload;
      const axisKey = axisId === 'x' ? 'xAxis' : 'yAxis';

      return {
        ...state,
        currentSpace: {
          ...state.currentSpace,
          [axisKey]: {
            ...state.currentSpace[axisKey],
            ...updates,
          },
          lastModified: new Date().toISOString(),
        },
      };
    }

    case 'ADD_MANIFESTATION': {
      if (!state.currentSpace) return state;

      // Check if coordinate already exists
      const exists = state.currentSpace.manifestations.some(
        m => m.x === action.payload.x && m.y === action.payload.y
      );

      if (exists) {
        // This shouldn't happen, but if it does, replace instead
        return spaceReducer(state, { type: 'REPLACE_MANIFESTATION', payload: action.payload });
      }

      return {
        ...state,
        currentSpace: {
          ...state.currentSpace,
          manifestations: [...state.currentSpace.manifestations, action.payload],
          lastModified: new Date().toISOString(),
        },
      };
    }

    case 'REPLACE_MANIFESTATION': {
      if (!state.currentSpace) return state;

      return {
        ...state,
        currentSpace: {
          ...state.currentSpace,
          manifestations: state.currentSpace.manifestations.map(m =>
            m.x === action.payload.x && m.y === action.payload.y
              ? action.payload
              : m
          ),
          lastModified: new Date().toISOString(),
        },
      };
    }

    case 'LOAD_SPACE': {
      return {
        ...state,
        currentSpace: action.payload,
        error: null,
      };
    }

    case 'SET_LOADING': {
      return {
        ...state,
        isGenerating: action.payload,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload,
        isGenerating: false,
      };
    }

    case 'SET_SELECTED_COORDINATE': {
      return {
        ...state,
        selectedCoordinate: action.payload,
      };
    }

    default:
      return state;
  }
}

// Context
type SpaceContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

// Provider component
export function SpaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(spaceReducer, initialState);

  return (
    <SpaceContext.Provider value={{ state, dispatch }}>
      {children}
    </SpaceContext.Provider>
  );
}

// Custom hook to use the context
export function useSpace() {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
}
