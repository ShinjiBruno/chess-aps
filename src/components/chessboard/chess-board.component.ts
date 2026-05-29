import { 
  Component, 
  ElementRef, 
  EventEmitter, 
  Input, 
  OnChanges, 
  OnDestroy, 
  OnInit, 
  Output, 
  SimpleChanges, 
  ViewChild 
} from '@angular/core';
import { Chessboard, COLOR, INPUT_EVENT_TYPE } from 'cm-chessboard/src/Chessboard';

@Component({
  selector: 'app-chess-board',
  standalone: true,
  templateUrl: `./chess-board.component.html`,
  styleUrl: `./chess-board.component.css`
})
export class ChessBoardComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('boardElement', { static: true }) boardElement!: ElementRef;

  @Input() fen: string = 'start';
  @Input() orientation: 'white' | 'black' = 'white';
  @Input() draggable: boolean = true;

  @Input() onMoveValidate?: (from: string, to: string) => boolean;
  
  @Output() moveMade = new EventEmitter<{ from: string; to: string }>();

  private board!: Chessboard;

  ngOnInit() {
    this.initBoard();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.board) return;

    if (changes['fen'] && !changes['fen'].firstChange) {
      this.board.setPosition(this.fen, true); 
    }

    if (changes['orientation'] && !changes['orientation'].firstChange) {
      this.board.setOrientation(this.orientation === 'white' ? COLOR.white : COLOR.black);
    }

    if (changes['draggable']) {
      this.setupInputHandler();
    }
  }

  private initBoard() {
    this.board = new Chessboard(this.boardElement.nativeElement, {
      position: this.fen,
      orientation: this.orientation === 'white' ? COLOR.white : COLOR.black,
      assetsUrl: './assets/assets/',
      style: {
        pieces: {file: './pieces/standard.svg'}
      }
    });

    this.setupInputHandler();
  }

  private setupInputHandler() {
    if (!this.draggable) {
      this.board.disableMoveInput();
      return;
    }

    // Captura os eventos de arrastar/clicar da biblioteca vanilla
    this.board.enableMoveInput((event) => {
      if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
        return true; // Permite iniciar o arraste da peça
      }
      
      if (event.type === INPUT_EVENT_TYPE.moveInputFinished) {
        if (!event.squareTo || event.squareFrom === event.squareTo) {
          return false; // Cancela se soltar fora ou na mesma casa
        }

        // Se houver uma função de validação injetada pelo componente pai:
        if (this.onMoveValidate) {
          const isValid = this.onMoveValidate(event.squareFrom, event.squareTo);
          if (isValid) {
            this.moveMade.emit({ from: event.squareFrom, to: event.squareTo });
            return true; // Confirma o movimento visualmente
          }
          return false; // Desfaz o movimento e a peça volta para a origem
        }

        // Se não houver validador, aceita o lance cegamente
        this.moveMade.emit({ from: event.squareFrom, to: event.squareTo });
        return true;
      }
      return true;
    });
  }

  ngOnDestroy() {
    if (this.board) {
      this.board.destroy(); 
    }
  }
}