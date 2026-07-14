import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '@/features/dashboard';
import { AnalyticsPage } from '@/features/analytics';
import { HeatmapPage } from '@/features/heatmap';
import { RiskPage } from '@/features/risk';
import { NetworkPage } from '@/features/network';
import { CrimeDataPage } from '@/features/crime-data';
import { AlertsPage } from '@/features/alerts';
import { EfirPage } from '@/features/efir/components/EfirPage';
import { DesignSystemPreview } from '@/components/templates/DesignSystemPreview';
import { LoginPage, ProtectedRoute, InviteOnboardPage } from '@/features/auth';
import {
  CrimesListPage,
  CrimeDetailWorkspace,
} from '@/features/entities';
import { ForecastPage } from '@/features/forecast';
import {
  ProfilePage,
  UsersPage,
  RolesPage,
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

/**
 * CrimeLens Main Router Setup
 *
 * Configures application-wide routing with clean separation of feature pages,
 * living design system documentation, and session security verification gate.
 */
function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/onboard" element={<InviteOnboardPage />} />

      {/* Protected Command Center Feature Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Operations */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/criminals/:criminalId" element={<CriminalProfilePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/efir" element={<EfirPage />} />

        {/* Crimes Module */}
        <Route path="/entities/crimes" element={<CrimesListPage />} />
        <Route path="/entities/crimes/:id" element={<CrimeDetailWorkspace />} />

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
        <Route path="/administration/districts" element={<DistrictsPage />} />
        <Route path="/administration/station-types" element={<StationTypesPage />} />
        <Route path="/administration/police-stations" element={<PoliceStationsPage />} />
        <Route path="/administration/police-ranks" element={<PoliceRanksPage />} />
        <Route path="/administration/police-officers" element={<PoliceOfficersPage />} />
        <Route path="/administration/criminals" element={<CriminalsPage />} />
        <Route path="/administration/crimes" element={<CrimesPage />} />
        <Route path="/administration/firs" element={<FirsPage />} />
        <Route path="/administration/settings" element={<SettingsPage />} />
        
        {/* Legacy Admin redirects */}
        <Route path="/admin/profile" element={<Navigate to="/administration/profile" replace />} />
        <Route path="/admin/users" element={<Navigate to="/administration/users" replace />} />
        <Route path="/admin/roles" element={<Navigate to="/administration/roles" replace />} />
        <Route path="/admin/settings" element={<Navigate to="/administration/settings" replace />} />
        <Route path="/admin/districts" element={<Navigate to="/administration/districts" replace />} />
        <Route path="/admin/station-types" element={<Navigate to="/administration/station-types" replace />} />
        <Route path="/admin/police-stations" element={<Navigate to="/administration/police-stations" replace />} />
        <Route path="/admin/police-ranks" element={<Navigate to="/administration/police-ranks" replace />} />
        <Route path="/admin/police-officers" element={<Navigate to="/administration/police-officers" replace />} />
        <Route path="/admin/criminals" element={<Navigate to="/administration/criminals" replace />} />
        <Route path="/admin/crimes" element={<Navigate to="/administration/crimes" replace />} />
        <Route path="/admin/firs" element={<Navigate to="/administration/firs" replace />} />
      </Route>

      {/* Living Design System Documentation */}
      <Route path="/design-system" element={<DesignSystemPreview />} />

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
