import "../../pair-components/icon";
import "../../pair-components/icon_button";
import "../../pair-components/tooltip";

import { MobxLitElement } from "@adobe/lit-mobx";
import { CSSResultGroup, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { Experiment } from "@llm-mediation-experiments/utils";

import { core } from "../../core/core";
import { ExperimentService } from "../../services/experiment_service";
import { FirebaseService } from "../../services/firebase_service";
import {
  NAV_ITEMS,
  NavItem,
  Pages,
  RouterService,
} from "../../services/router_service";

import { ExperimentStage } from "../../shared/types";

import { styles } from "./sidenav.scss";

/** Sidenav menu component */
@customElement("sidenav-menu")
export class SideNav extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];
  private readonly experimentService = core.getService(ExperimentService);
  private readonly firebaseService = core.getService(FirebaseService);
  private readonly routerService = core.getService(RouterService);

  override render() {
    return html`
      <div class="top">
        ${this.routerService.sidenavExperimentId === null ?
          this.renderExperimentList() :
          this.renderExperimentSubnav()
        }
      </div>
      <div class="bottom">
        ${NAV_ITEMS.filter(
          (navItem) => navItem.showInSidenav
        ).map((navItem) => this.renderNavItem(navItem))}
      </div>
    `;
  }

  private renderExperimentList() {
    const experiments = this.firebaseService.experiments;

    return html`
      ${experiments.length === 0 ?
        html`<div class="empty-message">No experiments yet.</div>` : nothing}
      ${experiments.map(experiment => this.renderExperimentItem(experiment))}
    `;
  }

  private renderExperimentSubnav() {
    const id = this.experimentService.id;
    const experiment = this.firebaseService.getExperiment(id);

    return html`
      ${this.renderExperimentItem(experiment, true)}
      ${this.experimentService.stageNames.map(
        (stage: string, index: number) =>
        this.renderStageItem(id, stage, index)
      )}
    `;
  }

  private renderExperimentBackArrow(id: string) {
    const handleClick = (e: Event) => {
      this.routerService.navigate(Pages.EXPERIMENT, { "experiment": id });
      this.routerService.setSidenavExperiment(null);
    }

    return html`
      <pr-tooltip text="Back to all experiments" position="BOTTOM_START">
        <pr-icon-button
          color="primary"
          variant="default"
          icon="arrow_back"
          @click=${handleClick}>
        </pr-icon-button>
      </pr-tooltip>
    `;
  }


  private renderExperimentForwardArrow(id: string) {
    const handleClick = (e: Event) => {
      this.routerService.navigate(Pages.EXPERIMENT, { "experiment": id });
      this.routerService.setSidenavExperiment(id);
    }

    return html`
      <pr-icon-button
        color="primary"
        variant="default"
        icon="arrow_forward"
        @click=${handleClick}>
      </pr-icon-button>
    `;
  }

  private renderExperimentItem(experiment: Experiment, backArrow = false) {
    const navItemClasses = classMap({
      "nav-item": true,
      "primary": true,
      selected: this.routerService.activePage === Pages.EXPERIMENT
        && experiment.id === this.experimentService.id,
    });

    const handleClick = (e: Event) => {
      this.routerService.navigate(
        Pages.EXPERIMENT, { "experiment": experiment.id }
      );
    }

    return html`
      <div class="nav-item-wrapper">
        ${backArrow ? this.renderExperimentBackArrow(experiment.id) : nothing}
        <div
          class=${navItemClasses}
          role="button"
          @click=${handleClick}>
          ${experiment.name}
        </div>
        ${!backArrow ? this.renderExperimentForwardArrow(experiment.id) : nothing}
      </div>
    `;
  }

  private renderStageItem(id: string, stage: string, index: number) {
    const navItemClasses = classMap({
      "nav-item": true,
      selected: this.routerService.activePage === Pages.EXPERIMENT_STAGE &&
        this.routerService.activeRoute.params["stage"] === stage,
    });

    const handleClick = (e: Event) => {
      this.routerService.navigate(Pages.EXPERIMENT_STAGE,
        { "experiment": id, "stage": `${index}` });
      }

    return html`
      <div class=${navItemClasses} role="button" @click=${handleClick}>
        ${index + 1}. ${stage}
      </div>
    `;
  }

  private renderNavItem(navItem: NavItem) {
    const navItemClasses = classMap({
      "nav-item": true,
      selected: this.routerService.activePage === navItem.page,
    });

    const handleNavItemClicked = (e: Event) => {
      this.routerService.navigate(navItem.page);
    };

    return html`
      <div class=${navItemClasses} role="button" @click=${handleNavItemClicked}>
        <pr-icon icon=${navItem.icon}></pr-icon>
        ${navItem.title}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sidenav-menu": SideNav;
  }
}
