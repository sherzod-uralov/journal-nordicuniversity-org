import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'articles',
    loadComponent: () => import('@features/articles/article-list.component').then(m => m.ArticleListComponent),
  },
  {
    path: 'articles/:slug',
    loadComponent: () => import('@features/articles/article-detail.component').then(m => m.ArticleDetailComponent),
  },
  {
    path: 'volumes',
    loadComponent: () => import('@features/volumes/volume-list.component').then(m => m.VolumeListComponent),
  },
  {
    path: 'volumes/:id',
    loadComponent: () => import('@features/volumes/volume-detail.component').then(m => m.VolumeDetailComponent),
  },
  {
    path: 'categories',
    loadComponent: () => import('@features/categories/category-list.component').then(m => m.CategoryListComponent),
  },
  {
    path: 'categories/:id',
    loadComponent: () => import('@features/categories/category-detail.component').then(m => m.CategoryDetailComponent),
  },
  {
    path: 'authors',
    loadComponent: () => import('@features/authors/author-list.component').then(m => m.AuthorListComponent),
  },
  {
    path: 'authors/:id',
    loadComponent: () => import('@features/authors/author-detail.component').then(m => m.AuthorDetailComponent),
  },
  {
    path: 'news',
    loadComponent: () => import('@features/news/news-list.component').then(m => m.NewsListComponent),
  },
  {
    path: 'news/:slug',
    loadComponent: () => import('@features/news/news-detail.component').then(m => m.NewsDetailComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('@features/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('@features/auth/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('@features/auth/register.component').then(m => m.RegisterComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'cabinet',
    canActivate: [authGuard],
    loadComponent: () => import('@features/cabinet/cabinet-layout.component').then(m => m.CabinetLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@features/cabinet/dashboard/cabinet-dashboard.component').then(m => m.CabinetDashboardComponent),
      },
      {
        path: 'articles',
        loadComponent: () => import('@features/cabinet/articles/my-articles.component').then(m => m.MyArticlesComponent),
      },
      {
        path: 'articles/new',
        loadComponent: () => import('@features/cabinet/articles/submit-article.component').then(m => m.SubmitArticleComponent),
      },
      {
        path: 'articles/edit/:slug',
        loadComponent: () => import('@features/cabinet/articles/edit-article.component').then(m => m.EditArticleComponent),
      },
      {
        path: 'articles/:id',
        loadComponent: () => import('@features/cabinet/articles/article-detail.component').then(m => m.ArticleDetailComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('@features/cabinet/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'payment/:articleId',
        loadComponent: () => import('@features/cabinet/payment/payment.component').then(m => m.PaymentComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('@features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
