import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Task } from '../task.model';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AddEditTaskComponent } from '../add-edit-task/add-edit-task.component';
import { TodoManagementService } from '../todo-management.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TodoMgmtWebSocketService } from '../todo-mgmt-web-socket.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

/*const ELEMENT_DATA: Task[] = [
  { id: 0, title: 'Create Wireframes',description: 'Design wireframes for new feature' },
  { id: 1, title: 'Conduct Interview', description: 'Conduct interviews for new project' },
  { id: 2, title: 'Do Unit Testing', description: 'Complete unit testing of deliverables'},
  { id: 3, title: 'Design System Implementation', description: 'Create design for our product' }
];*/

@Component({
  selector: 'app-task-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['title', 'status', 'priority', 'actions'];
  ELEMENT_DATA: Task[] = [];
  dataSource = new MatTableDataSource(this.ELEMENT_DATA);
  filterValues = {
    title: '', id: 0,
    description: ''
  };
  tasks: any[] = [];
  private reconnectInterval = 2000;
  private wsSubscription: Subscription | undefined;
  private isWebSocketConnected = false;
  @ViewChild(MatTable) table: MatTable<any> | undefined;
  online_user_count = '1';
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
  totalTaskCount = 0;
  pageSize = 5;
  currentPage = 1;

  private TASK_LOCKED_MSG = "This task is opened for edit by other user. Please try after sometime.";
  private FETCH_STATUS_ERR_MSG = 'Error while fetching lock status. Please try again later.';

  filters = {
    status: '',
    priority: '',
    title: ''
  };

  statusList = [
    {value: '', uiValue : 'All Tasks'},
    {value: 'Not Started', uiValue : 'Not Started'},
    {value: 'In-Progress', uiValue : 'In-Progress'},
    {value: 'Completed', uiValue : 'Completed'}
  ];

  priorityList = [
    {value: '', uiValue : 'All Tasks'},
    {value: 'Low', uiValue : 'Low'},
    {value: 'Medium', uiValue : 'Medium'},
    {value: 'High', uiValue : 'High'}
  ];

  constructor(public dialog: MatDialog, private changeDetectorRefs: ChangeDetectorRef,
    private todoService: TodoManagementService, private snackBar: MatSnackBar,
    private webSocketService: TodoMgmtWebSocketService
  ) {
  }

  ngOnInit() {
    //this.getTasks(this.paginator);
    this.getTasksWithFilters(this.paginator);
  }

  ngAfterViewInit(): void {
    if (this.paginator)
      this.dataSource.paginator = this.paginator;
    this.connectWebSocket();
  }

  /*private reconnect(): void {
    console.log('Reconnecting...');
    setTimeout(() => this.connectWebSocket(), this.reconnectInterval);
  }*/

  private connectWebSocket(): void {
    this.webSocketService.onTaskUpdate().subscribe({
      next: (update) => {
        //console.log('Task update received:', update);
        this.handleWebSocketMessage(update);
      },
      error: (error) => {
        //console.error('WebSocket error:', error);
        this.snackBar.open('Error while connecting to websocket. '+ error.message, 'Close');
      },
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.closeConnection();
  }

  /*getAllTasks() {
    this.todoService.getAllTasks().subscribe({
      next: data => {
        this.ELEMENT_DATA = data;
        this.dataSource = new MatTableDataSource(this.ELEMENT_DATA);
        this.changeDetectorRefs.detectChanges();
        if (this.table)
          this.table.renderRows();
      },
      error: error => {
        this.snackBar.open('Error while fetching data. Please try again later', 'Close');
      }
    });
  }*/

  /*getTasks(event: any) {

    const page = event ? event.pageIndex + 1 : this.currentPage;
    const pageSize = event ? event.pageSize : this.pageSize;

    this.todoService.getTasks(page, pageSize).subscribe((response: any) => {
      this.ELEMENT_DATA = response.tasks;
      this.dataSource = new MatTableDataSource(this.ELEMENT_DATA);
      this.changeDetectorRefs.detectChanges();
      if (this.table)
        this.table.renderRows();
      this.totalTaskCount = response.totalTaskCount;
      this.pageSize = response.pageSize;
      this.currentPage = response.page;
    });
  }*/

  openDialog(): void {
    const dialogRef = this.dialog.open(AddEditTaskComponent, {
      width: '250px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(data => {
      if (data != '' && data != undefined) {
        //data['sid'] = this.webSocketService.socket?.id;
        let task = JSON.stringify(data);
        this.todoService.addTasks(task).subscribe({
          next: data => {
            if(data.status == "error"){
              this.snackBar.open(data.message, 'Close');
            }
            //this.snackBar.open('Task added successfully !', 'Close');
            //this.getAllTasks();
          },
          error: error => {
            this.snackBar.open('Error while saving task. Please try again later. '+error.message, 'Close');
          }
        });
      }
    });
  }

  editTask(taskObj: any) {
    //check if task is open for edit by another user
    this.todoService.handleTaskLock(taskObj['_id'], "edit").subscribe({
      next: data => {
        if(data.task_locked == "f"){
          const dialogRef = this.dialog.open(AddEditTaskComponent, {
            width: '250px',
            disableClose: true,
            data: taskObj
          });
          dialogRef.afterClosed().subscribe(data => {

            this.todoService.releaseLock(taskObj['_id']).subscribe({
              next: data => {
              },
              error: error => {
                this.snackBar.open('Error while releasing lock. '+error.message, 'Close');
              }
            });

            if (data != '' && data != undefined) {
              let task = JSON.stringify(data);
              this.todoService.editTask(task).subscribe({
                next: data => {
                  if(data.status == "error"){
                    this.snackBar.open(data.message, 'Close');
                  }
                  //this.snackBar.open('Task edited successfully !', 'Close');
                  //this.getAllTasks();
                },
                error: error => {
                  this.snackBar.open('Error while editing task. Please try again later. '+error.message, 'Close');
                }
              });
            }
          });
        }else{
          this.snackBar.open(this.TASK_LOCKED_MSG, 'Close');
        }
      },
      error: error => {
        this.snackBar.open(this.FETCH_STATUS_ERR_MSG+" "+error.message, 'Close');
      }
    });

    
  }

  deleteTask(taskObj: any) {
    //check if task is open for edit by another user
    this.todoService.handleTaskLock(taskObj['_id'], "delete").subscribe({
      next: data => {
        if(data.task_locked == "f"){
          this.todoService.deleteTask(taskObj['_id']).subscribe({
            next: data => {
              if(data.status == "error"){
                this.snackBar.open(data.message, 'Close');
              }
              //this.snackBar.open('Task deleted successfully !', 'Close');
              //this.getAllTasks();
            },
            error: error => {
              this.snackBar.open('Error while deleting task. Please try again later. '+error, 'Close');
            }
          });
        }else{
          this.snackBar.open(this.TASK_LOCKED_MSG, 'Close');
        }
      },
      error: error => {
        this.snackBar.open(this.FETCH_STATUS_ERR_MSG, 'Close');
      }});
    
  }
  private isRefreshingTasks = false;

  private handleWebSocketMessage(message: any): void {
    //console.log('Handling WebSocket message:', message);

    if (this.isRefreshingTasks) {
      //console.log('Skipping task refresh to prevent loop.');
      return;
    }

    this.isRefreshingTasks = true;

    switch (message.type) {
      case 'ADD_TASK':
        this.snackBar.open('New Task added. Refreshing view.', 'Close');
        this.getTasksWithFilters(this.paginator);
        /*setTimeout(() => {
          this.getAllTasks(); 
        }, 500); */

        break;

      case 'EDIT_TASK':
        this.snackBar.open('Task edited. Refreshing view.', 'Close');
        this.getTasksWithFilters(this.paginator);
        break;

      case 'DELETE_TASK':
        this.snackBar.open('Task deleted. Refreshing view.', 'Close');
        this.getTasksWithFilters(this.paginator);
        break;

      case 'ONLINE_COUNT':
        this.online_user_count = message.count;
        this.changeDetectorRefs.detectChanges();
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }

    this.isRefreshingTasks = false;
  }

  applyFilters(): void {
    this.currentPage = 1; 
    this.getTasksWithFilters();
  }

  getTasksWithFilters(event?: PageEvent): void {
    const page = event ? event.pageIndex + 1 : this.currentPage;
    const pageSize = event ? event.pageSize : this.pageSize;

    this.todoService.searchTasks(this.filters, page, pageSize).subscribe({
      next: data => {
        this.ELEMENT_DATA = data.tasks;
        this.dataSource = new MatTableDataSource(this.ELEMENT_DATA);
        this.changeDetectorRefs.detectChanges();
        if (this.table)
          this.table.renderRows();
        this.totalTaskCount = data.totalTaskCount;
        this.pageSize = data.pageSize;
        this.currentPage = data.page;
      },
      error: error => {
        this.snackBar.open('Error while fetching data. Please try again later. '+error.message, 'Close');
      }
    });
  }
}
