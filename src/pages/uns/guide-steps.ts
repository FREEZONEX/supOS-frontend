import I18nStore from '@/stores/i18n-store';
import { Step, StepOptions } from 'shepherd.js';
import guideVideo1 from '@/assets/guide/uns_step1.mp4';
import guideVideo2 from '@/assets/guide/uns_step2.mp4';

// 新手导航步骤
export const guideSteps: () => Array<StepOptions> | Array<Step> = () => [
  {
    id: 'uns_step1',
    cancelIcon: {
      enabled: false,
    },
    classes: 'guide-video-classes no-attach',
    text: `
        <div class="video-title">${I18nStore.getIntl('uns.guideVideo1Title')}</div>
        <div class="video-info">${I18nStore.getIntl('uns.guideVideo1Info')}</div>
        <video class="guide-video" autoplay muted loop controls>
          <source src="${guideVideo1}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        `,
    attachTo: undefined,
    buttons: [
      {
        action() {
          return this.complete();
        },
        text: I18nStore.getIntl('global.tipExit'),
        classes: 'prev-class',
      },
      {
        action() {
          return this.next();
        },
        text: I18nStore.getIntl('global.tipNext'),
      },
    ],
  },
  {
    id: 'uns_step2',
    cancelIcon: {
      enabled: false,
    },
    classes: 'guide-video-classes no-attach',
    text: `
        <div class="video-title">${I18nStore.getIntl('uns.guideVideo2Title')}</div>
        <div class="video-info">${I18nStore.getIntl('uns.guideVideo2Info')}</div>
        <video class="guide-video" autoplay muted loop controls>
          <source src="${guideVideo2}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        `,
    attachTo: undefined,
    buttons: [
      {
        action() {
          return this.complete();
        },
        text: I18nStore.getIntl('global.tipExit'),
        classes: 'prev-class',
      },
      {
        action() {
          return this.back();
        },
        text: I18nStore.getIntl('global.tipBack'),
        classes: 'back-class',
      },
      {
        action() {
          return this.complete();
        },
        text: I18nStore.getIntl('global.tipDone'),
      },
    ],
  },
];
