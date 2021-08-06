import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../app.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Settings } from '../models/settings';
import { Configuration } from '../models/configuration';
import { Subscription } from 'rxjs';
import { CloudAppEventsService, AlertService, CloudAppSettingsService, CloudAppConfigService, CloudAppRestService, EntityType, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';

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
  private config: any;
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

  constructor(
    private appService: AppService,
    private eventsService: CloudAppEventsService,
    private http: HttpClient,
    private alert: AlertService,
	private settingsService: CloudAppSettingsService,
	private configService: CloudAppConfigService,
	private restService: CloudAppRestService
  ) { }

  ngOnInit() {
    this.appService.setTitle('Reaching out');
	 this.configService.get().subscribe( config => {this.config = config as Configuration; }); 
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
	err => this.alert.error(`Record does not exist`));
	this.running = false;
  }
  
  aresCourseLookup(id) {
	this.aresCourse = null;
	this.AresCourseUrl = `${this.settings.AresUrl}/ares/webapi/Courses/${id}`;  
	this.http.get(this.AresCourseUrl, {headers: {'X-ARES-API-KEY': this.settings.AresApiKey}}).subscribe( res => {
		this.aresCourse = res;
		this.almaCourseLookup(this.aresCourse.registrarCourseId);
	}, err => this.alert.error(`Course does not exist in Ares`));
  }
  
  almaCourseLookup(id) {
	  this.restService.call(`/courses?q=searchable_ids~${id}`).subscribe( res => {
		  this.almaCourse = res.course[0];
		  this.readingListLookup(this.almaCourse.id);
	  }, err => this.alert.error(`No matching course in Alma`) );
  }
  
  readingListLookup(id) {
	  this.restService.call(`/courses/${id}/reading-lists`).subscribe( res => {
		  this.readingLists = res;
	  }, err => this.alert.error(`Problem with course reading lists`) );
  }

	placeOnReserveAndCreateList(aresItemId) {
		this.routeInAres(aresItemId);
		this.createListAndAdd();
	}

	placeOnReserve(aresItemId, almaReadingListId) {
		this.routeInAres(aresItemId);
		this.addToList(almaReadingListId, this.almaCourse.id);
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
			}, err => this.alert.error(`Problem creating reading list. Check to be sure a reading list with this course code does not already exist.`) );
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
				this.alert.success(`Item added to reading list`);
			}, err => this.alert.error(`Problem adding item to reading list`) );
	}
	
	routeInAres(aresItemId) {
		this.AresRouteUrl = `${this.settings.AresUrl}/ares/webapi/Items/${aresItemId}/route`;
		this.status = {'newStatus':'Item Available at Reserve Desk'};
		this.http.post(this.AresRouteUrl, this.status, {headers: {'X-ARES-API-KEY': this.settings.AresApiKey, 'Content-Type': 'application/json'}}).subscribe( res => {
			this.route = res;
			this.alert.success(`New Ares status: ${this.route.currentStatus}`);
			this.clearForm();
		}, err => this.alert.error(`Error: ${err.statusText}`) );
	}
		
	
	clearForm() {
		this.record = null;
		this.aresCourse = null;
		this.almaCourse = null;
		this.identifier.reset();
	}
	
 }