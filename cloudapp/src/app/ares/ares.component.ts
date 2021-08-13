import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../app.service';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Settings } from '../models/settings';
import { Subscription } from 'rxjs';
import { CloudAppEventsService, AlertService, CloudAppSettingsService, CloudAppRestService, EntityType, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ares',
  templateUrl: './ares.component.html',
  styleUrls: ['./ares.component.scss']
})
export class AresComponent implements OnInit {
  private pageLoad$: Subscription;
  running = false;
  record: any;
  aresCourse: any;
  almaCourse: any;
  settings: Settings;
  identifier = new FormControl('');
  AresItemUrl: any;
  AresCourseUrl: any;
  readingLists: any;
  AresRouteUrl: any;
  route: any;
  status: any;
  itemIds: any;
  citation: any;
  almaResult: any;
  readingListObj;
  almaReadingList: any;
  almaCourseId: any;
  newReadingList: any;
  selectedReadingList: any;

  constructor(
    private appService: AppService,
    private eventsService: CloudAppEventsService,
    private http: HttpClient,
    private alert: AlertService,
	private settingsService: CloudAppSettingsService,
	private restService: CloudAppRestService
  ) { }

  ngOnInit() {
    this.appService.setTitle('Reaching out');
	 this.settingsService.get().subscribe( settings => {this.settings = settings as Settings; }); 
	 this.pageLoad$ = this.eventsService.onPageLoad( pageInfo => {
		const entities = (pageInfo.entities||[]).filter(e=>e.type==EntityType.ITEM);
		if (entities.length > 0) {
		  this.itemIds = entities[0].link.split("/");
		}
	 });
  }

  search(id) {
	this.running = true;
    this.record = null; 
	this.AresItemUrl = `${this.settings.AresUrl}/ares/webapi/Items/${id}`;
    this.http.get(this.AresItemUrl, {headers: {'X-ARES-API-KEY': this.settings.AresApiKey}}).subscribe( res => {
		this.record = res;
		this.aresCourseLookup(this.record.courseId);
	}		, 
	err => { 
			this.alert.error(`{{ 'alert.no_record' | translate }}`);
			this.running = false;
		}
	);
  }
  
  aresCourseLookup(id) {
	this.aresCourse = null;
	this.AresCourseUrl = `${this.settings.AresUrl}/ares/webapi/Courses/${id}`;  
	this.http.get(this.AresCourseUrl, {headers: {'X-ARES-API-KEY': this.settings.AresApiKey}}).subscribe( res => {
		this.aresCourse = res;
		this.almaCourseLookup(this.aresCourse[this.settings.AresLinkingField]);
	}, err => {
		this.alert.error(`{{ 'alert.no_ares_course' | translate }}`);
		this.running = false;
	}
	);
  }
  
  almaCourseLookup(id) {
	this.restService.call(`/courses?q=searchable_ids~${id}`).subscribe( res => {
		  this.almaCourse = res.course[0];
		  this.readingListLookup(this.almaCourse.id);
	  }, err => {
		  this.alert.error(`{{ 'alert.no_alma_course' | translate }}`);
		  this.running = false;		  
	  }
	);
  }
  
  readingListLookup(id) {
	  this.restService.call(`/courses/${id}/reading-lists`).subscribe( res => {
		  this.readingLists = res;
	  }, err => this.alert.error(`{{ 'alert.list_error' | translate }}`) );
	  this.running = false;
  }

	placeOnReserveAndCreateList(aresItemId) {
		this.running = true;
		this.routeInAres(aresItemId);
		this.createListAndAdd();
		this.running = false;
	}

	placeOnReserve(aresItemId, almaReadingListId) {
		this.running = true;
		this.routeInAres(aresItemId);
		if (almaReadingListId == 'use_selected_list') {
			this.addToList(this.selectedReadingList, this.almaCourse.id);
		} else {
			this.addToList(almaReadingListId, this.almaCourse.id);
		}
		this.running = false;
	}
	
	createListAndAdd() {
		this.readingListObj = `{
			"code": "${this.almaCourse.code}-${this.almaCourse.section}",
			"name": "${this.almaCourse.code}-${this.almaCourse.section}",
			"due_back_date": "${this.almaCourse.end_date}",
			"status": {
				"value": "Complete"
			},
			"publishingStatus": {
				"value": "PUBLISHED"
			}
		}`;
		this.restService.call( {
			url: `/courses/${this.almaCourse.id}/reading-lists`,
			method: HttpMethod.POST,
			headers: {"Content-Type": "application/json"},
			requestBody: this.readingListObj
		}).subscribe( res => {
				this.almaReadingList = res;
				this.almaCourseId =  this.almaReadingList.link.split("/")[4];
				this.addToList(this.almaReadingList.id, this.almaCourseId);
			}, err => this.alert.error(`{{ 'alert.list_create_error' | translate }}`) );
	}
	
	addToList(almaReadingListId, almaCourseId) {
		//Add to reading list in Alma
		this.citation = `{
			"status": {
				"value": "Complete"
			},
			"copyrights_status": {
				"value": "NOTREQUIRED"
			},
			"type": {
				"value": "BK"
			},
			"metadata": {
				"mms_id": "${this.itemIds[2]}"
			}
		}`;
		this.restService.call( {
			url: `/courses/${almaCourseId}/reading-lists/${almaReadingListId}/citations`,
			requestBody: this.citation,
			method: HttpMethod.POST,
			headers: {"Content-Type": "application/json"}
			}).subscribe( res => {
				this.almaResult = res;
				console.log(this.almaResult);
				this.alert.success(`{{ 'alert.added' | translate }}`);
			}, err => this.alert.error(`{{ 'alert.added_error' | translate }}`) );
	}
	
	routeInAres(aresItemId) {
		this.AresRouteUrl = `${this.settings.AresUrl}/ares/webapi/Items/${aresItemId}/route`;
		this.status = {'newStatus':'Item Available at Reserve Desk'};
		this.http.post(this.AresRouteUrl, this.status, {headers: {'X-ARES-API-KEY': this.settings.AresApiKey, 'Content-Type': 'application/json'}}).subscribe( res => {
			this.route = res;
			this.alert.success(`{{ 'alert.new_ares_status' | translate }}: ${this.route.currentStatus}`);
			this.clearForm();
		}, err => this.alert.error(`{{ 'alert.error' | translate }}: ${err.statusText}`) );
	}
		
	
	clearForm() {
		this.record = null;
		this.aresCourse = null;
		this.almaCourse = null;
		this.identifier.reset();
	}
	
	changeValue(value) {
		this.selectedReadingList = value;
		console.log(this.selectedReadingList);
	}
	
 }