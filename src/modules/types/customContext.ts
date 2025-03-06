import { Context, Scenes } from "telegraf";
import { Project, GroupBuy, MessagesToEdit, Participant, User } from "./specificInterfaces";

interface BaseSessionData extends Scenes.SceneSession {
  [key: string]: any;
}

interface KickstarterSessionData extends BaseSessionData {
  project?: Project;
  groupbuy?: GroupBuy;
  messages?: MessagesToEdit;
}

interface UserSessionData extends BaseSessionData {
  preferences?: any;
  settings?: any;
}

interface BaseContext extends Context {
  session: BaseSessionData;
  scene: Scenes.SceneContextScene<BaseContext>;
}

interface KickstarterContext extends BaseContext {
  session: KickstarterSessionData;
  scene: Scenes.SceneContextScene<KickstarterContext>;
}

interface UserContext extends BaseContext {
  session: UserSessionData;
  scene: Scenes.SceneContextScene<UserContext>;
}

type CustomContext = KickstarterContext;

export {
  BaseContext,
  KickstarterContext,
  UserContext,
  CustomContext,
  KickstarterSessionData,
  UserSessionData,
  BaseSessionData,
};