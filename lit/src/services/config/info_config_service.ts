import { computed, get, observable, makeObservable, toJS } from "mobx";

import { Service } from "../service";

import { InfoStageConfig, StageKind } from "@llm-mediation-experiments/utils";

/** Manages metadata for info stage config. */
export class InfoConfigService extends Service {
  constructor() {
    super();
    makeObservable(this);
  }

  @observable stage: InfoStageConfig|null = null;

  @computed get name() {
    return this.stage?.name;
  }

  @computed get content() {
    return this.stage?.infoLines[0];
  }

  updateName(name: string) {
    if (this.stage) {
      this.stage.name = name;
    }
  }

  updateContent(content: string) {
    if (this.stage) {
      this.stage.infoLines = [content];
    }
  }

  reset() {
    this.stage = null;
  }
}