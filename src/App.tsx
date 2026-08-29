import { Routes, Route, Navigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { DashboardPage } from '@/features/dashboard';
import { AnalyticsPage } from '@/features/analytics';
import { HeatmapPage } from '@/features/heatmap';
// import { RiskPage } from '@/features/risk';
import { NetworkPage, Network1Page } from '@/features/network';
import { CrimeDataPage } from '@/features/crime-data';
import { AlertsPage } from '@/features/alerts';
import { EfirPage } from '@/features/efir/components/EfirPage';
import { DesignSystemPreview } from '@/components/templates/DesignSystemPreview';
import {
  CrimesListPage,
  CrimeDetailWorkspace,
  EvidenceMatchesPage,
} from '@/features/entities';
import { ForecastPage } from '@/features/forecast';
import {
  ProfilePage,
  UsersPage,
  RolesPage,
  PermissionsPage,
  SettingsPage,
  DistrictsPage,
  StationTypesPage,
  PoliceStationsPage,
  PoliceRanksPage,
  PoliceOfficersPage,
  CriminalsPage,
  CrimesPage,
  FirsPage,
  CriminalProfilePage,
} from '@/features/admin';
import {
  PoliceOfficersPage as EntitiesOfficersPage,
  CriminalsPage as EntitiesCriminalsPage,
  CriminalProfilePage as EntitiesCriminalProfilePage,
} from '@/features/entities';

import { AnalyticsFiltersProvider } from '@/hooks/useAnalyticsFilters';
import usePermissions from '@/hooks/usePermissions';
import { getDefaultRedirectPath } from '@/config/routes';
import { InviteOnboardPage, LoginPage, ProtectedRoute, NoAccessPage } from '@/features/auth';
import { CrimeLensAssistant } from '@/components/platform/CrimeLensAssistant';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setAssistantOpen } from '@/store/uiSlice';

/**
 * CrimeLens Main Router Setup
 *
 * Configures application-wide routing with clean separation of feature pages,
 * living design system documentation, and session security verification gate.
 */
function DefaultRedirect() {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return null;

  return <Navigate to={getDefaultRedirectPath(hasPermission)} replace />;
}

function App() {
  const assistantOpen = useAppSelector((s) => s.ui.assistantOpen);
  const dispatch = useAppDispatch();

  return (
    <AnalyticsFiltersProvider>
      <div className="flex h-screen flex-col overflow-hidden relative">
        <div className="flex flex-1 min-h-0">
          {/* Routes Container */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/user/invite" element={<InviteOnboardPage />} />

              <Route element={<ProtectedRoute />}>
                {/* Command Center Feature Routes */}
                <Route path="/" element={<DefaultRedirect />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/criminals/:criminalId" element={<CriminalProfilePage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/heatmap" element={<HeatmapPage />} />
                {/* <Route path="/risk" element={<RiskPage />} /> */}
                <Route path="/network" element={<NetworkPage />} />
                <Route path="/network1" element={<Network1Page />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/efir" element={<EfirPage />} />

                {/* Crimes Module */}
                <Route path="/entities/crimes" element={<CrimesListPage />} />
                <Route path="/entities/crimes/:id" element={<CrimeDetailWorkspace />} />
                <Route path="/entities/evidence-matches" element={<EvidenceMatchesPage />} />

                {/* Forecast */}
                <Route path="/forecast" element={<ForecastPage />} />

                {/* Entities Module */}
                <Route path="/entities/officers" element={<EntitiesOfficersPage />} />
                <Route path="/entities/criminals" element={<EntitiesCriminalsPage />} />
                <Route path="/entities/criminals/:criminalId" element={<EntitiesCriminalProfilePage />} />

                {/* Data Operations */}
                <Route path="/data/crime-records" element={<CrimeDataPage />} />
                <Route path="/data/upload" element={<CrimeDataPage />} />
                <Route path="/data/efir" element={<Navigate to="/efir" replace />} />
                <Route path="/data-management" element={<Navigate to="/data/crime-records" replace />} />

                {/* Administration */}
                <Route path="/administration/profile" element={<ProfilePage />} />
                <Route path="/administration/users" element={<UsersPage />} />
                <Route path="/administration/roles" element={<RolesPage />} />
                <Route path="/administration/permissions" element={<PermissionsPage />} />
                <Route path="/administration/districts" element={<DistrictsPage />} />
                <Route path="/administration/station-types" element={<StationTypesPage />} />
                <Route path="/administration/police-stations" element={<PoliceStationsPage />} />
                <Route path="/administration/police-ranks" element={<PoliceRanksPage />} />
                <Route path="/administration/police-officers" element={<PoliceOfficersPage />} />
                <Route path="/administration/criminals" element={<CriminalsPage />} />
                <Route path="/administration/crimes" element={<CrimesPage />} />
                <Route path="/administration/firs" element={<FirsPage />} />
                <Route path="/administration/settings" element={<SettingsPage />} />

                <Route path="/no-access" element={<NoAccessPage />} />

                {/* Living Design System Documentation */}
                <Route path="/design-system" element={<DesignSystemPreview />} />

                {/* Fallback Catch-all Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </div>

          {/* Assistant Sidebar */}
          {assistantOpen && (
            <div className="w-[420px] shrink-0 border-l border-border bg-background overflow-hidden">
              <CrimeLensAssistant />
            </div>
          )}
        </div>

        {/* FAB - Only shown when assistant is closed */}
        {!assistantOpen && (
          <button
            type="button"
            onClick={() => dispatch(setAssistantOpen(true))}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-3.5 py-2.5 text-sm font-medium text-primary-foreground shadow-2xl transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open CrimeLens AI assistant"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        )}
      </div>
    </AnalyticsFiltersProvider>
  );
}

export default App;
