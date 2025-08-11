package org.example.blogbackend.controller;

import org.example.blogbackend.entity.Article;
import org.example.blogbackend.service.ArticleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/api/articles")
public class ArticleController {
    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public List<Article> list() {
        return articleService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Article> get(@PathVariable Integer id) {
        return articleService.findById(id);
    }

    @PostMapping
    public Article create(@RequestBody Article article) {
        return articleService.save(article);
    }

    @PutMapping("/{id}")
    public Article update(@PathVariable Integer id, @RequestBody Article article) {
        article.setId(id);
        return articleService.save(article);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        articleService.deleteById(id);
    }
}