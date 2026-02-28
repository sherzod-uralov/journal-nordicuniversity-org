import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { ToastService } from '@core/services/toast.service';

interface UiState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  loading: boolean;
}

const initialState: UiState = {
  sidebarOpen: false,
  mobileMenuOpen: false,
  loading: false,
};

export const UiStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const toast = inject(ToastService);

    return {
      toggleSidebar(): void {
        patchState(store, { sidebarOpen: !store.sidebarOpen() });
      },
      toggleMobileMenu(): void {
        patchState(store, { mobileMenuOpen: !store.mobileMenuOpen() });
      },
      closeMobileMenu(): void {
        patchState(store, { mobileMenuOpen: false });
      },
      setLoading(loading: boolean): void {
        patchState(store, { loading });
      },
      addToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        toast[type](message);
      },
    };
  }),
);
