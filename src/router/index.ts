import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/actors/:tag",
      name: "actorList",
      component: () => import("../views/ActorListView.vue"),
    },
    {
      path: "/actor/:actorName",
      name: "actorWorks",
      component: () => import("../views/ActorWorksView.vue"),
    },
    {
      path: "/selected-works",
      name: "selectedWorks",
      component: () => import("../views/SelectedWorksView.vue"),
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
    },
  ],
});

export default router;
