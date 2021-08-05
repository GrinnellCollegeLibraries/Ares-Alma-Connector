import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { FormGroup, FormControl } from '@angular/forms';
import { AlertService, CloudAppConfigService, FormGroupUtil } from '@exlibris/exl-cloudapp-angular-lib';
import { Configuration } from '../models/configuration';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {

  form: FormGroup;
  saving = false;
  
  constructor(
    private appService: AppService,
	private configService: CloudAppConfigService,
	private alert: AlertService,
  ) { }

  ngOnInit() {
	this.appService.setTitle('Configuration');
	this.configService.get().subscribe( configuration => {
		this.form = FormGroupUtil.toFormGroup(Object.assign(new Configuration(), configuration))
	});
  }
  
  save() {
	  this.saving = true;
	  this.configService.set(this.form.value).subscribe(
	    response => {
		  this.alert.success('Configuration successfully saved.');
		  this.form.markAsPristine();
		},
		err => this.alert.error(err.message)
	  );
	  this.saving = false;
  }
}
