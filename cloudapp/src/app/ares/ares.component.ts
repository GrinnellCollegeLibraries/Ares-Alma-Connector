import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../app.service';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Configuration } from '../models/configuration';
import { Subscription } from 'rxjs';
import { CloudAppEventsService, AlertService, CloudAppConfigService, CloudAppRestService, EntityType, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
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
  settings: Configuration;
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
	private configuration: CloudAppConfigService,
	private restService: CloudAppRestService,
	private translate: TranslateService
  ) { }

  ngOnInit() {
    this.appService.setTitle('Reaching out');
	 this.configuration.get().subscribe( settings => {this.settings = settings as Configuration; }); 
	 this.pageLoad$ = this.eventsService.onPageLoad( pageInfo => {
		const entities = (pageInfo.entities||[]).filter(e=>e.type==EntityType.ITEM);
		if (entities.length > 0) {
		  this.itemIds = entities[0].link.split("/");
		}
	 });
  }

  search(id) {
	  let requestHeaders = null;
	  if (this.settings.AresUrl == '' || this.settings.AresApiKey == '' || this.settings.AresLinkingField == '') {
		  this.alert.error(this.translate.instant('alert.no_config'));
		  return;
	  }
	  if (!this.itemIds) {
		  this.alert.error(this.translate.instant('alert.no_item'),  { autoClose: true })
		  return;
	  }
	this.running = true;
    this.record = null; 
	if (this.settings.AresUrl.indexOf('.ares.atlas-sys.com') == -1) {
		this.AresItemUrl = `https://api.exldevnetwork.net/proxy/ares/webapi/Items/${id}`;
		this.eventsService.getAuthToken().subscribe(
			authToken => {
					requestHeaders = new HttpHeaders({
					'X-ARES-API-KEY': this.settings.AresApiKey,	
					'X-Proxy-Host': this.settings.AresUrl, 
					'Authorization': `Bearer ${authToken}`
				})
				this.issueItemRequest (requestHeaders);
			})
	}
	else {
		this.AresItemUrl = `${this.settings.AresUrl}/ares/webapi/Items/${id}`;
		requestHeaders = new HttpHeaders({
			'X-ARES-API-KEY': this.settings.AresApiKey
		})
		this.issueItemRequest (requestHeaders);
	}
  }
  
  aresCourseLookup(id) {
	let requestHeaders = null;
	this.aresCourse = null;
	if (this.settings.AresUrl.indexOf('.ares.atlas-sys.com') == -1) {		
		this.AresCourseUrl = `https://api.exldevnetwork.net/proxy/ares/webapi/Courses/${id}`; 
		this.eventsService.getAuthToken().subscribe(
			authToken => {
				requestHeaders = new HttpHeaders({
					'X-Proxy-Host': this.settings.AresUrl, 
					'Authorization': `Bearer ${authToken}`,
					'X-ARES-API-KEY': this.settings.AresApiKey
				})
				this.issueCourseRequest(requestHeaders);
			}
		)
	}
	else {
		this.AresCourseUrl = `${this.settings.AresUrl}/ares/webapi/Courses/${id}`; 
		requestHeaders = new HttpHeaders({
			'X-ARES-API-KEY': this.settings.AresApiKey
		})
		this.issueCourseRequest (requestHeaders);
	}
  }
  
  almaCourseLookup(id) {
	this.restService.call(`/courses?q=searchable_ids~${id}`).subscribe( res => {
		  this.almaCourse = res.course[0];
		  this.readingListLookup(this.almaCourse.id);
	  }, err => {
		  this.alert.error(this.translate.instant('alert.no_alma_course'));
		  this.running = false;		  
	  }
	);
  }
  
  readingListLookup(id) {
	  this.restService.call(`/courses/${id}/reading-lists`).subscribe( res => {
		  this.readingLists = res;
	  }, err => this.alert.error(this.translate.instant('alert.list_error')) );
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
			}, err => this.alert.error(this.translate.instant('alert.list_create_error')) );
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
				this.alert.success(this.translate.instant('alert.added'));
			}, err => this.alert.error(this.translate.instant('alert.added_error')) );
	}
	
	routeInAres(aresItemId) {
		this.AresRouteUrl = `${this.settings.AresUrl}/ares/webapi/Items/${aresItemId}/route`;
		this.status = {'newStatus':'Item Available at Reserve Desk'};
		this.http.post(this.AresRouteUrl, this.status, {headers: {'X-ARES-API-KEY': this.settings.AresApiKey, 'Content-Type': 'application/json'}}).subscribe( res => {
			this.route = res;
			this.alert.success(this.translate.instant('alert.new_ares_status')`: ${this.route.currentStatus}`);
			this.clearForm();
		}, err => this.alert.error(this.translate.instant('alert.error')`: ${err.statusText}`) );
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
	
	issueItemRequest (sHeaders) {
		this.http.get(this.AresItemUrl, {headers: sHeaders}).subscribe( res => {
			this.record = res;
			this.aresCourseLookup(this.record.courseId);
		}, 	err => { 
				this.alert.error(this.translate.instant('alert.no_record'));
				this.running = false;
			}
		);
	}

	issueCourseRequest(sHeaders) {
		this.http.get(this.AresCourseUrl, {headers: sHeaders}).subscribe( res => {
			this.aresCourse = res;
			this.almaCourseLookup(this.aresCourse[this.settings.AresLinkingField]);
		}, err => {
				this.alert.error(this.translate.instant('alert.no_ares_course'));
				this.running = false;
			}
		);
	}
 }