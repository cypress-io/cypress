import { HttpClientModule } from '@angular/common/http'
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterModule } from '@angular/router'
import { InlineSVGModule } from 'ng-inline-svg'
import { ButtonModule } from 'primeng/button'
import { AddStyleComponent } from './add-style/add-style.component'
import { AppComponent } from './app.component'
import { AssetsImageComponent } from './assets-image/assets-image.component'
import { BootstrapButtonComponent } from './bootstrap-button/bootstrap-button.component'
import { HighlightDirective } from './directives/highlight/highlight.directive'
import { HeroService } from './hero.service'
import { HtmlMountComponent } from './html-mount/html-mount.component'
import { ImageSnapshotComponent } from './image-snapshot/image-snapshot.component'
import { InputComponent } from './input/input.component'
import { MaterialButtonComponent } from './material-button/material-button.component'
import './my-custom-element'
import { MyValuesService } from './my-values.service'
import { NetworkService } from './network.service'
import { NetworkComponent } from './network/network.component'
import { NgInlineSvgComponent } from './ng-inline-svg/ng-inline-svg.component'
import { OnPushStratComponent } from './on-push-strat/on-push-strat.component'
import { OutputSubscribeComponent } from './output-subscribe/output-subscribe.component'
import { CapitalizePipe } from './pipes/capitalize/capitalize.pipe'
import { PrimengButtonComponent } from './primeng-button/primeng-button.component'
import { routes } from './routes'
import { PageOneComponent } from './routing/page-one/page-one.component'
import { RoutingComponent } from './routing/routing.component'
import { ScssStyleComponent } from './scss-style/scss-style.component'
import { ServiceStubComponent } from './service-stub/service-stub.component'
import { TimeoutComponent } from './timeout/timeout.component'
import { UseCustomElementComponent } from './use-custom-element/use-custom-element.component'

@NgModule({
  declarations: [
    AppComponent,
    OnPushStratComponent,
    NetworkComponent,
    HtmlMountComponent,
    OutputSubscribeComponent,
    HighlightDirective,
    CapitalizePipe,
    ImageSnapshotComponent,
    MaterialButtonComponent,
    BootstrapButtonComponent,
    AddStyleComponent,
    InputComponent,
    ServiceStubComponent,
    UseCustomElementComponent,
    AssetsImageComponent,
    PrimengButtonComponent,
    ScssStyleComponent,
    TimeoutComponent,
    RoutingComponent,
    PageOneComponent,
    NgInlineSvgComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    InlineSVGModule.forRoot(),
    BrowserAnimationsModule,
    ButtonModule,
    MatButtonModule,
    RouterModule.forRoot(routes),
  ],
  providers: [HeroService, NetworkService, MyValuesService],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
