import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface AnalyticsFiltersState {
  startDate: string | null;
  setStartDate: (date: string | null) => void;
  endDate: string | null;
  setEndDate: (date: string | null) => void;
  isSingleDate: boolean;
  setIsSingleDate: (isSingle: boolean) => void;
  district: string | null;
  setDistrict: (district: string | null) => void;
  districtId: string | null;
  setDistrictId: (districtId: string | null) => void;
  stationId: string | null;
  setStationId: (stationId: string | null) => void;
  crimeCategory: string | null;
  setCrimeCategory: (category: string | null) => void;
}

export const AnalyticsFiltersContext = createContext<AnalyticsFiltersState | undefined>(undefined);

export function AnalyticsFiltersProvider({ children }: { children: ReactNode }) {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isSingleDate, setIsSingleDate] = useState<boolean>(false);
  const [district, setDistrict] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [stationId, setStationId] = useState<string | null>(null);
  const [crimeCategory, setCrimeCategory] = useState<string | null>(null);

  return (
    <AnalyticsFiltersContext.Provider
      value={{
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        isSingleDate,
        setIsSingleDate,
        district,
        setDistrict,
        districtId,
        setDistrictId,
        stationId,
        setStationId,
        crimeCategory,
        setCrimeCategory,
      }}
    >
      {children}
    </AnalyticsFiltersContext.Provider>
  );
}

export function useAnalyticsFilters() {
  const context = useContext(AnalyticsFiltersContext);
  if (context === undefined) {
    throw new Error('useAnalyticsFilters must be used within an AnalyticsFiltersProvider');
  }
  return context;
}
