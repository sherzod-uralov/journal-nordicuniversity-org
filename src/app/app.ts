import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { RenderModeIndicatorComponent } from '@shared/components/render-mode-indicator/render-mode-indicator.component';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { SearchOverlayComponent } from '@shared/components/search-overlay/search-overlay.component';
import { ScrollToTopComponent } from '@shared/components/scroll-to-top/scroll-to-top.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, RenderModeIndicatorComponent, ConfirmDialog, SearchOverlayComponent, ScrollToTopComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
