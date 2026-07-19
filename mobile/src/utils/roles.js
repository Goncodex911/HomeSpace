/**
 * Navigate to the correct home screen based on user role after auth.
 */
export function getHomeRouteForUser(user) {
  if (!user) return 'Home';
  if (user.role === 'admin') return 'AdminDashboard';
  if (user.role === 'store') return 'StoreDashboard';
  return 'Home';
}

export function resetToRoleHome(navigation, user) {
  const name = getHomeRouteForUser(user);
  navigation.reset({ index: 0, routes: [{ name }] });
}
