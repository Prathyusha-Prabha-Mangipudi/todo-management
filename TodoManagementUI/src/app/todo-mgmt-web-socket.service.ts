import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class TodoMgmtWebSocketService implements OnDestroy {

  socket: Socket | undefined;
  private isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.socket = io('http://localhost:5000', {
        transports: ['websocket'], // Force WebSocket transport
      });
      //console.log('WebSocket connection initialized');
    }

  }

  onTaskUpdate(): Observable<any> {
    return new Observable((subscriber) => {
      if (this.socket)
        this.socket.on('message', (data) => {
          //console.log('Task update received:', data);
          subscriber.next(data);
        });

      return () => {
        //console.log('Unsubscribing from task_update');
        if (this.socket)
          this.socket.off('message');
      };
    });
  }

  closeConnection(): void {
    if (this.socket)
      this.socket.disconnect();
  }

  ngOnDestroy(): void {
    this.closeConnection();
  }
}

