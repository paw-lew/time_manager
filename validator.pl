% activity(Id, Name, Type, StartTime, Duration, Importance).


% Główna walidacja
validate_schedule :-
    findall(X, activity(X,_,_,_,_,_), Activities),
    print_activities(Activities),
    check_time_conflicts(Activities),
    check_rest_time(Activities),
    check_similar_names(Activities),
    suggest_improvements(Activities).


% Wyświetlanie aktywności - pomocnicza
print_activities([]).
print_activities([A|Rest]) :-
    activity(A, Name, Type, Start, Duration, Importance),
    format('Activity ~w: ~w (~w) at ~w for ~w minutes (importance: ~w)~n', 
           [A, Name, Type, Start, Duration, Importance]),
    print_activities(Rest).

% Konflikty czasowe - CHECK
check_time_conflicts([]).
check_time_conflicts([A|Rest]) :-
    activity(A, NameA, _, StartA, DurationA, _),
    EndA is StartA + DurationA,
    format('Checking conflicts for ~w (Start: ~w, End: ~w)~n', [NameA, StartA, EndA]),
    check_conflicts(A, EndA, StartA, NameA, Rest),
    check_time_conflicts(Rest).

check_conflicts(_, _, _, _, []).
check_conflicts(A, EndA, StartA, NameA, [B|Rest]) :-
    activity(B, NameB, _, StartB, DurationB, _),
    EndB is StartB + DurationB,
    format('Comparing with ~w (Start: ~w, End: ~w)~n', [NameB, StartB, EndB]),
    (
        (StartB < EndA, StartA < EndB) ->
        format('conflict:Activities "~w" and "~w" overlap~n', 
               [NameA, NameB])
        ; true
    ),
    check_conflicts(A, EndA, StartA, NameA, Rest).

% Wystarczająco odpoczynku - CHECK
check_rest_time(Activities) :-
    findall(Duration, (
        member(A, Activities),
        activity(A, _, work, _, Duration, _)
    ), WorkDurations),
    sum_list(WorkDurations, TotalWork),
    format('Total work time: ~w minutes~n', [TotalWork]),
    (TotalWork > 480 -> % Więcej niż 8 godzin pracy
        format('rest_warning:Too much work time (~w minutes). Consider adding more breaks~n', [TotalWork])
        ; true
    ).

% Podobne nazwy - CHECK
check_similar_names([]).
check_similar_names([A|Rest]) :-
    activity(A, NameA, _, _, _, _),
    check_name_similarity(NameA, Rest),
    check_similar_names(Rest).

check_name_similarity(_, []).
check_name_similarity(NameA, [B|Rest]) :-
    activity(B, NameB, _, _, _, _),
    atom_length(NameA, LenA),
    atom_length(NameB, LenB),
    levenshtein_distance(NameA, NameB, Distance),
    format('Comparing names: ~w vs ~w (distance: ~w)~n', [NameA, NameB, Distance]),
    (
        (Distance < 3, LenA > 3, LenB > 3, NameA \= NameB) ->
        format('duplicate:Activities "~w" and "~w" have similar names~n', [NameA, NameB])
        ; true
    ),
    check_name_similarity(NameA, Rest).

% Levenshtein distance implementation
levenshtein_distance(S1, S2, D) :-
    atom_chars(S1, Chars1),
    atom_chars(S2, Chars2),
    levenshtein(Chars1, Chars2, D).

levenshtein([], L2, D) :- length(L2, D).
levenshtein(L1, [], D) :- length(L1, D).
levenshtein([H|T1], [H|T2], D) :-
    levenshtein(T1, T2, D).
levenshtein([_|T1], [_|T2], D) :-
    levenshtein(T1, T2, D1),
    D is D1 + 1.

% Propozycje poprawy planu
suggest_improvements(Activities) :-
    findall(Duration, (
        member(A, Activities),
        activity(A, _, work, _, Duration, _)
    ), WorkDurations),
    sum_list(WorkDurations, TotalWork),
    format('Checking for improvements (Total work: ~w)~n', [TotalWork]),
    (
        TotalWork > 240,
        \+ has_break_after_work(Activities) ->
        format('suggestion:Consider adding a break after long work sessions~n')
        ; true
    ).

has_break_after_work(Activities) :-
    member(A, Activities),
    activity(A, _, work, StartA, DurationA, _),
    EndA is StartA + DurationA,
    member(B, Activities),
    activity(B, _, rest, StartB, _, _),
    StartB >= EndA,
    StartB =< EndA + 60.