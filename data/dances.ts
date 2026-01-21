
import { Dance } from '../types';

export const initialDances: Dance[] = [
  {
    id: 'salsa',
    name: 'Сальса',
    elements: [
      { id: 'salsa-1', name: 'Основной шаг', description: 'Базовое движение вперед и назад на 8 счетов.', difficulty: 'easy' },
      { id: 'salsa-2', name: 'Поворот направо', description: 'Поворот партнерши под рукой партнера.', difficulty: 'easy' },
      { id: 'salsa-3', name: 'Кросс-боди лид', description: 'Смена мест партнеров с ведением.', difficulty: 'medium' },
      { id: 'salsa-4', name: 'Обратный поворот', description: 'Поворот партнерши в обратную сторону.', difficulty: 'medium' },
      { id: 'salsa-5', name: 'Сузи Кью', description: 'Характерное движение стоп в сторону.', difficulty: 'hard' },
    ],
  },
  {
    id: 'bachata',
    name: 'Бачата',
    elements: [
      { id: 'bachata-1', name: 'Основной шаг', description: 'Три шага в сторону и теп на 4-й счет.', difficulty: 'easy' },
      { id: 'bachata-2', name: 'Поворот', description: 'Простой поворот партнерши или партнера.', difficulty: 'easy' },
      { id: 'bachata-3', name: 'Романтика', description: 'Движение с волной корпуса.', difficulty: 'medium' },
      { id: 'bachata-4', name: 'Смена мест', description: 'Партнеры меняются местами.', difficulty: 'medium' },
      { id: 'bachata-5', name: 'Слайд', description: 'Скользящее движение ногой.', difficulty: 'easy' },
    ],
  },
  {
    id: 'cha-cha-cha',
    name: 'Ча-ча-ча',
    elements: [
      { id: 'cha-1', name: 'Шассе', description: 'Быстрый тройной шаг "ча-ча-ча".', difficulty: 'easy' },
      { id: 'cha-2', name: 'Нью-Йорк', description: 'Открытие в сторону со скрестным шагом.', difficulty: 'medium' },
      { id: 'cha-3', name: 'Тайм-степ', description: 'Базовое движение на месте.', difficulty: 'easy' },
      { id: 'cha-4', name: 'Рука к руке', description: 'Партнеры расходятся и сходятся, держась за руки.', difficulty: 'medium' },
      { id: 'cha-5', name: 'Спот-поворот', description: 'Поворот на месте для партнерши и партнера.', difficulty: 'hard' },
    ],
  },
];
