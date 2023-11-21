import { Component, OnInit } from '@angular/core';
import { AuthAdminService } from '@shared';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'geoparks_new';

  constructor(private authAdminService: AuthAdminService) {}

  public ngOnInit(): void {
    this.authAdminService.fillAuthDataByToken();
  }
}
