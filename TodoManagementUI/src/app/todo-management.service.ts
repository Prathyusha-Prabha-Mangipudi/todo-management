import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class TodoManagementService {

  private pyserverurl = "http://127.0.0.1:5000/";
  //private getTasksUrl = this.pyserverurl + "get_tasks";
  private createTaskUrl = this.pyserverurl + "add_task";
  private deleteTaskUrl = this.pyserverurl + "delete_task";
  private editTaskUrl = this.pyserverurl + "edit_task";
  private searchTaskUrl = this.pyserverurl + "search_tasks";
  //private taskPaginationUrl = this.pyserverurl + "tasks";
  private handleTaskLockUrl = this.pyserverurl + "handle_lock_status";
  private releaseLockUrl = this.pyserverurl + "release_lock";

  constructor(private http: HttpClient) { }

  /*getAllTasks(): Observable<any> {
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate,post-check=0, pre-check=0',
      Pragma: 'no-cache',
      Expires: '0',
    });
    const params = new HttpParams().set('t', new Date().getTime().toString());
    return this.http.get(this.getTasksUrl, { headers, params });
  }

  getTasks(page: number, pageSize: number) {
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate,post-check=0, pre-check=0',
      Pragma: 'no-cache',
      Expires: '0',
    });
    const params = new HttpParams()
    .set('t', new Date().getTime().toString())
    .set('page', page.toString())
    .set('pageSize', pageSize.toString());
    return this.http.get(this.taskPaginationUrl, { headers, params });
  }*/

  addTasks(task: any): Observable<any> {
    return this.http.post(this.createTaskUrl, task, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  editTask(task: any): Observable<any> {
    return this.http.post(this.editTaskUrl, task, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  deleteTask(taskId : any): Observable<any> {
    return this.http.delete(this.deleteTaskUrl+"/"+taskId);
  }

  handleTaskLock(taskId : any, action : any): Observable<any> {
    return this.http.post(this.handleTaskLockUrl+"/"+taskId+"/"+action, undefined);
  }

  releaseLock(taskId : any): Observable<any> {
    return this.http.post(this.releaseLockUrl+"/"+taskId, undefined);
  }

  searchTasks(searchKey : any, page: number, pageSize: number) : Observable<any> {
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate,post-check=0, pre-check=0',
      Pragma: 'no-cache',
      Expires: '0',
    });
    let params = new HttpParams()
    .set('t', new Date().getTime().toString())
    .set('page', page.toString())
    .set('pageSize', pageSize.toString());
    if (searchKey.status) {
      params = params.set('status', searchKey.status);
    }
    if (searchKey.priority) {
      params = params.set('priority', searchKey.priority);
    }
    if (searchKey.title) {
      params = params.set('title', searchKey.title);
    }
    return this.http.get(this.searchTaskUrl, { headers, params });
  }
}
